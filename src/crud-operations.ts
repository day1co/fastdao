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
  since?: Date | string;
  until?: Date | string;
  offset?: number;
  limit?: number;
  /** @deprecated */
  projection?: Array<string>;
}

export interface CrudOperationsOpts<ID = number, ROW = any> {
  knex: Knex; // 읽기/쓰기 연결
  knexReplica?: Knex; // 읽기 전용 연결
  table: string;
  idColumn?: string;
  createdAtColumn?: string;
  updatedAtColumn?: string;
  weaver?: Weaver;
}

export interface SelectOperations<ID = number, ROW = any> {
  select(filter?: CrudFilter<ID, ROW>, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<Array<ROW>>;
  count(filter?: CrudFilter<ID, ROW>): Promise<number>;
  // FIXME: any -> U
  selectFirst(equal: any, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<ROW>;
  selectById(id: ID, relations?: Array<Relation>): Promise<ROW>;
}

export interface InsertOperations<ID = number, ROW = any> {
  insert(data: ROW | Array<ROW>): Promise<ROW>;
}

export interface UpdateOperations<ID = number, ROW = any> {
  updateById(id: ID, data: ROW): Promise<number>;
}

export interface DeleteOperations<ID = number, ROW = any> {
  deleteById(id: ID): Promise<number>;
}

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
  private readonly weaver?: Weaver;

  private constructor(opts: CrudOperationsOpts<ID, ROW>) {
    // main connection for read/write
    this.knex = opts.knex;
    // separated connection for read-only
    this.knexReplica = opts.knexReplica || opts.knex;
    this.table = opts.table;
    this.idColumn = opts.idColumn ?? 'id';
    this.createdAtColumn = opts.createdAtColumn ?? 'created_at';
    this.updatedAtColumn = opts.updatedAtColumn ?? 'updated_at';
    // for relations
    this.weaver = opts.weaver;
  }

  //---------------------------------------------------------
  // SelectOperation

  async select(filter?: CrudFilter<ID, ROW>, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<Array<ROW>> {
    const rows = this.knexReplica(this.table)
      .modify((queryBuilder) => {
        this.applyFilter(queryBuilder, filter);
        this.applySort(queryBuilder, sorts);
      })
      .select(filter?.projection);
    if (relations && relations.length > 0) {
      return this.weaver.weave(await rows, relations);
    }
    return rows;
  }

  async count(filter?: CrudFilter<ID, ROW>): Promise<number> {
    const rows = await this.knexReplica(this.table)
      .modify((queryBuilder) => {
        this.applyFilter(queryBuilder, filter);
      })
      .count();
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
    // result is varying on dialect
    // mysql: the first one, sqlite3: the last one, ...
    // see http://knexjs.org/#Builder-insert
    const [insertId] = await this.knex(this.table).insert(data, [this.idColumn]);
    // return just inserted row
    // use same data source to avoid replication delay
    return this.knex(this.table)
      .where(
        this.idColumn,
        insertId > 0 ? insertId : Array.isArray(data) ? data[0][this.idColumn] : data[this.idColumn]
      )
      .first();
  }

  //---------------------------------------------------------
  // UpdateOperation

  async updateById(id: ID, data: ROW): Promise<number> {
    return this.knex(this.table).where({ id }).update(data);
  }

  //---------------------------------------------------------
  // DeleteOperation

  async deleteById(id: ID): Promise<number> {
    return this.knex(this.table).where(this.idColumn, id).delete();
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
  // extension point

  protected applyFilter(queryBuilder: Knex.QueryBuilder, filter?: CrudFilter<ID, ROW>) {
    if (!filter) {
      return;
    }
    const { exclude, include, min, max, since, until, offset, limit } = filter;
    if (exclude) {
      for (const [key, value] of Object.entries(exclude)) {
        if (canExactMatch(value)) {
          queryBuilder.whereNot(this.columnName(key), value);
        } else if (canExactMatchIn(value)) {
          queryBuilder.whereNotIn(this.columnName(key), value as Array<any>);
        }
      }
    }
    if (include) {
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

  protected applySort(queryBuilder: Knex.QueryBuilder, sorts?: Array<Sort>) {
    if (!sorts || !sorts.length) {
      return;
    }
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

  protected columnName(name) {
    return `${this.table}.${name}`;
  }
}
