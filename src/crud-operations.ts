import * as Knex from 'knex';

import { SortOrder, Sort, parseSorts } from './sort';
import { Relation, parseRelations } from './relation';
import { Weaver } from './weaver';
import { canExactMatch, canExactMatchIn } from './util';

export interface CrudFilter<ID = number, ROW = any> {
  // for exact match
  include?: any;
  // for exact mismatch
  exclude?: any;
  //id: ID;
  //type: any;
  //state: any;
  min?: ID;
  max?: ID;
  since?: Date | string | number;
  until?: Date | string | number;
  offset?: number;
  limit?: number;
  /** @deprecated */
  projection?: Array<string>;
}

export interface CustomFilter<ID = number, ROW = any> {
  // return truthy to break here(skip no built-in filter processing)!
  (queryBuilder: Knex.QueryBuilder, filter?: CrudFilter<ID, ROW>): any;
}

export interface CrudOperationsOpts<ID = number, ROW = any> {
  knex: Knex; // 읽기/쓰기 연결
  knexReplica?: Knex; // 읽기 전용 연결
  table: string;
  idColumn?: string;
  createdAtColumn?: string;
  updatedAtColumn?: string;
  customFilter?: CustomFilter<ID, ROW>;
  weaver?: Weaver;
  /** @deprecated */
  safeDelete?: any;
}

export interface SelectOperations<ID = number, ROW = any> {
  select(filter?: CrudFilter<ID, ROW>, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<Array<ROW>>;
  count(filter?: CrudFilter<ID, ROW>): Promise<number>;
  // FIXME: any -> U
  selectFirst(equal: any, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<ROW>;
  selectById(id: ID, relations?: Array<Relation>): Promise<ROW>;
}

export interface InsertOperations<ID = number, ROW = any> {
  insert(data: ROW): Promise<ROW>;
  //TODO: insertAll(data: Array<ROW>): Promise<ID>;
  //TODO: insertAndReturn(data: ROW): Promise<ROW>;
  //TODO: insertAllAndReturn(data: Array<ROW>): Promise<Array<ROW>>;
}

export interface UpdateOperations<ID = number, ROW = any> {
  updateById(id: ID, data: ROW): Promise<number>;
  //TODO: updateAll(filter: CrudFilter<ID, ROW>): Promise<void>;
}

export interface DeleteOperations<ID = number, ROW = any> {
  deleteById(id: ID): Promise<number>;
  //TODO: deleteAll(filter: CrudFilter<ID, ROW>): Promise<ID>;
}

// TODO: export interface UpsertOperations<ID=number, U=any> {
// upsert(data: ROW): Promise<ROW>;
// }

interface Transacting<ID = number, ROW = any> {
  transacting(tx: Knex.Transaction): CrudOperations<ID, ROW>;
}

export class CrudOperations<ID = number, ROW = any>
  implements
    SelectOperations<ID, ROW>,
    InsertOperations<ID, ROW>,
    UpdateOperations<ID, ROW>,
    DeleteOperations<ID, ROW>,
    Transacting<ID, ROW> {
  public static create<ID, ROW>(opts: CrudOperationsOpts<ID, ROW>) {
    return new CrudOperations(opts);
  }

  public readonly knex: Knex | Knex.Transaction;
  public readonly knexReplica: Knex | Knex.Transaction;
  public readonly table: string;
  private readonly idColumn: string;
  private readonly createdAtColumn: string;
  private readonly updatedAtColumn: string;
  private readonly customFilter: CustomFilter<ID, ROW>;
  private readonly weaver?: Weaver;
  /** @deprecated */
  private readonly safeDelete?: any;

  private constructor(opts: CrudOperationsOpts<ID, ROW>) {
    // main connection for read/write
    this.knex = opts.knex;
    // separated connection for read-only
    this.knexReplica = opts.knexReplica || opts.knex;
    this.table = opts.table;
    this.idColumn = opts.idColumn ?? 'id';
    this.createdAtColumn = opts.createdAtColumn ?? 'created_at';
    this.updatedAtColumn = opts.updatedAtColumn ?? 'updated_at';
    this.customFilter = opts.customFilter;
    // for relations
    this.weaver = opts.weaver;
    // for safe delete
    this.safeDelete = opts.safeDelete || { state: 'DELETED' };
  }

  //---------------------------------------------------------
  // SelectOperation

  async select(filter?: CrudFilter<ID, ROW>, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<Array<ROW>> {
    const queryBuilder = this.queryBuilderWithFilter(filter);
    if (sorts && sorts.length > 0) {
      this.applySort(queryBuilder, sorts);
    }
    const rows = queryBuilder.select(filter?.projection);
    if (relations && relations.length > 0) {
      return this.weaver.weave(await rows, relations);
    }
    return rows;
  }

  async count(filter?: CrudFilter<ID, ROW>): Promise<number> {
    const rows = await this.queryBuilderWithFilter(filter).count();
    return rows[0]['count(*)'];
  }

  // FIXME: any -> U
  async selectFirst(include: any, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<ROW | undefined> {
    const rows = await this.select({ include, limit: 1 }, sorts, relations);
    return rows[0];
  }

  async selectById(id: ID, relations?: Array<Relation>): Promise<ROW | undefined> {
    return this.selectFirst({ [this.idColumn]: id }, null, relations);
  }

  //---------------------------------------------------------
  // InsertOperation

  async insert(data: ROW | Array<ROW>): Promise<ROW> {
    const now = new Date();
    if (Array.isArray(data)) {
      for (const datum of data) {
        if (this.createdAtColumn) {
          data[this.createdAtColumn] = now;
        }
        if (this.updatedAtColumn) {
          data[this.updatedAtColumn] = now;
        }
      }
    } else {
      if (this.createdAtColumn) {
        data[this.createdAtColumn] = now;
      }
      if (this.updatedAtColumn) {
        data[this.updatedAtColumn] = now;
      }
    }
    const [insertId] = await this.knex(this.table).insert(data);
    // return just inserted row
    // use same data source to avoid replication delay
    return this.knex(this.table)
      .where(this.idColumn, insertId > 0 ? insertId : data[this.idColumn])
      .limit(1)
      .first();
  }

  //---------------------------------------------------------
  // UpdateOperation

  async updateById(id: ID, data: ROW): Promise<number> {
    if (this.updatedAtColumn) {
      data[this.updatedAtColumn] = new Date();
    }
    return this.knex(this.table).where({ id }).update(data);
  }

  //---------------------------------------------------------
  // DeleteOperation

  async deleteById(id: ID): Promise<number> {
    const queryBuilder = this.knex(this.table).where(this.idColumn, id);
    // for safe delete: not delete! just update as deleted!
    if (this.safeDelete) {
      return queryBuilder.update(this.safeDelete);
    }
    return queryBuilder.delete();
  }

  //---------------------------------------------------------
  // TransactionSupport

  transacting(tx: Knex.Transaction): CrudOperations<ID, ROW> {
    return new Proxy(this, {
      get(target, p, _) {
        // XXX: within transaction, use tx instead of knex/knexReplica
        if (p === 'knex' || p === 'knexReplica') {
          return tx;
        }
        return target[p];
      },
    });
  }

  //---------------------------------------------------------
  // for compat

  /**
   * @deprecated in favor of select()
   */
  async selectAll(filter: any = {}, columns?: any) {
    process.emitWarning('selectAll() is deprecated in favor of select()', 'DeprecationWarning');
    const include = {
      id: filter.id || filter.ids || filter._id || filter._ids,
      type: filter.type || filter.types || filter._type || filter._types,
      state: filter.state || filter.states || filter._state || filter._states,
    };
    // no explicit `state` filter specified,
    // exclude deleted by default
    const exclude = include.state ? undefined : { state: 'DELETED' };
    return this.select(
      {
        include,
        exclude,
        min: filter.min || filter._min,
        max: filter.max || filter._max,
        since: filter.since || filter._since,
        until: filter.until || filter._until,
        projection: columns,
      },
      parseSorts(filter.sort || filter._sort),
      parseRelations(filter.rels || filter._rels)
    );
  }

  //---------------------------------------------------------

  private queryBuilderWithFilter(filter?: CrudFilter<ID, ROW>): Knex.QueryBuilder {
    const queryBuilder = this.knexReplica(this.table);
    if (this.customFilter) {
      if (this.customFilter(queryBuilder, filter)) {
        // when custom filter returns truthy,
        // break here! no more filter!
        return queryBuilder;
      }
    }
    if (filter) {
      this.applyFilter(queryBuilder, filter);
    }
    return queryBuilder;
  }

  private applyFilter(queryBuilder: Knex.QueryBuilder, filter: CrudFilter<ID, ROW>) {
    const { exclude, include, min, max, since, until, offset, limit } = filter;
    // exclude exact match
    if (exclude && typeof exclude === 'object') {
      for (const [key, value] of Object.entries(exclude)) {
        if (canExactMatch(value)) {
          queryBuilder.whereNot(this.columnName(key), value);
        } else if (canExactMatchIn(value)) {
          queryBuilder.whereNotIn(this.columnName(key), value as Array<any>);
        }
      }
    }
    // include exact match
    if (include && typeof include === 'object') {
      for (const [key, value] of Object.entries(include)) {
        if (canExactMatch(value)) {
          queryBuilder.where(this.columnName(key), value);
        } else if (canExactMatchIn(value)) {
          queryBuilder.whereIn(this.columnName(key), value as Array<any>);
        }
      }
    }
    if (canExactMatch(min)) {
      queryBuilder.where(this.columnName(this.idColumn), '>=', min);
    }
    if (canExactMatch(max)) {
      queryBuilder.where(this.columnName(this.idColumn), '<', max);
    }
    if (canExactMatch(since)) {
      queryBuilder.where(this.columnName(this.createdAtColumn), '>=', since);
    }
    if (canExactMatch(until)) {
      queryBuilder.where(this.columnName(this.updatedAtColumn), '<', until);
    }
    if (offset > 0) {
      queryBuilder.offset(offset);
    }
    if (limit > 0) {
      queryBuilder.limit(limit);
    }
  }

  private applySort(queryBuilder: Knex.QueryBuilder, sorts: Array<Sort>) {
    for (const sort of sorts) {
      queryBuilder.orderBy(
        this.columnName(sort.column),
        {
          [SortOrder.ASC]: 'ASC',
          [SortOrder.DESC]: 'DESC',
        }[sort.order]
      );
    }
  }

  private columnName(name) {
    return `${this.table}.${name}`;
  }
}
