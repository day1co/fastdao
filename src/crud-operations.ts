import { Knex } from 'knex';
import type { IdType, RowType } from './crud.type';
import { Relation } from './relation';
import { SortOrder, Sort } from './sort';
import { canExactMatch, canExactMatchIn, isNull } from './util';
import { Weaver } from './weaver';

export interface CrudFilter<ID extends IdType = number, ROW extends RowType = RowType> {
  // for exact match
  include?: ROW;
  // for exact mismatch
  exclude?: ROW;
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

/** @deprecated */
export type CrudFilterColumns<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

/** @deprecated */
export interface StrictTypedCrudFilter<ID extends IdType, ROW = any> extends CrudFilter<ID> {
  include?: CrudFilterColumns<ROW>;
  exclude?: CrudFilterColumns<ROW>;
}

export interface CrudOperationsOpts<ID extends IdType = number, ROW extends RowType = RowType> {
  knex: Knex; // 읽기/쓰기 연결
  knexReplica?: Knex; // 읽기 전용 연결
  table: string;
  idColumn?: string;
  createdAtColumn?: string;
  updatedAtColumn?: string;
  weaver?: Weaver<ID, ROW>;
}

export interface SelectOperations<ID extends IdType, ROW extends RowType> {
  select(filter?: CrudFilter<ID, ROW>, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<Array<ROW>>;

  count(filter?: CrudFilter<ID, ROW>): Promise<number>;

  selectFirst(filter?: CrudFilter<ID, ROW>, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<ROW | undefined>;

  exist(filter?: CrudFilter<ID, ROW>): Promise<boolean>;

  selectById(id: ID, relations?: Array<Relation>): Promise<ROW | undefined>;
}

export interface InsertOperations<ROW extends RowType> {
  insert(data: ROW | Array<ROW>): Promise<ROW>;
}

export interface UpdateOperations<ID extends IdType, ROW extends RowType> {
  updateById(id: ID, data: ROW): Promise<number>;

  update(filter: CrudFilter<ID, ROW>, data: ROW): Promise<number>;
}

export interface DeleteOperations<ID extends IdType, ROW extends RowType> {
  deleteById(id: ID): Promise<number>;

  delete(filter: CrudFilter<ID, ROW>): Promise<number>;
}

interface Transacting<ID extends IdType, ROW extends RowType> {
  transacting(tx: Knex.Transaction): CrudOperations<ID, ROW>;
}

export class CrudOperations<ID extends IdType = number, ROW extends RowType = RowType>
  implements
    SelectOperations<ID, ROW>,
    InsertOperations<ROW>,
    UpdateOperations<ID, ROW>,
    DeleteOperations<ID, ROW>,
    Transacting<ID, ROW>
{
  [x: string | symbol]: unknown; // XXX: transacting 구현에서의 컴파일 에러를 막기 위한 코드

  public static create<ID extends IdType = number, ROW extends RowType = RowType>(opts: CrudOperationsOpts<ID, ROW>) {
    return new CrudOperations<ID, ROW>(opts);
  }

  public readonly knex: Knex | Knex.Transaction;
  public readonly knexReplica: Knex | Knex.Transaction;
  public readonly table: string;
  private readonly idColumn: string;
  private readonly createdAtColumn: string;
  private readonly updatedAtColumn: string;
  private readonly weaver?: Weaver<ID, ROW>;

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

  async select(
    filter?: CrudFilter<ID, RowType>,
    sorts?: Array<Sort>,
    relations?: Array<Relation>
  ): Promise<Array<ROW>> {
    const query = this.knexReplica(this.table).modify((queryBuilder) => {
      this.applyFilter(queryBuilder, filter);
      this.applySort(queryBuilder, sorts);
      if (filter?.offset !== undefined && filter?.offset > 0) {
        queryBuilder.offset(filter?.offset);
      }
      if (filter?.limit !== undefined && filter?.limit > 0) {
        queryBuilder.limit(filter?.limit);
      }
    });
    const rows = filter?.projection ? query.select(filter.projection) : query.select();

    if (relations && relations.length > 0 && this.weaver) {
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

  async selectFirst(
    filter?: CrudFilter<ID, RowType>,
    sorts?: Array<Sort>,
    relations?: Array<Relation>
  ): Promise<ROW | undefined> {
    const rows = await this.select({ ...filter, limit: 1 }, sorts, relations);
    return rows[0];
  }

  async exist(filter?: CrudFilter<ID, ROW>): Promise<boolean> {
    const row = await this.selectFirst(filter);
    return row !== undefined;
  }

  async selectById(id: ID, relations?: Array<Relation>): Promise<ROW | undefined> {
    return this.selectFirst({ include: { [this.idColumn]: id } }, undefined, relations);
  }

  //---------------------------------------------------------
  // InsertOperation

  async insert(data: ROW | Array<ROW>): Promise<ROW> {
    // result is varying on dialect
    // mysql: the first one, sqlite3: the last one, ...
    // see http://knexjs.org/#Builder-insert
    const [insertId] = await this.knex(this.table).insert(data);
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
    return this.knex(this.table).where(this.idColumn, id).update(data);
  }

  async update(filter: CrudFilter<ID, ROW>, data: ROW): Promise<number> {
    return this.knex(this.table)
      .modify((queryBuilder) => {
        this.applyFilter(queryBuilder, filter);
      })
      .update(data);
  }

  //---------------------------------------------------------
  // DeleteOperation

  async deleteById(id: ID): Promise<number> {
    return this.knex(this.table).where(this.idColumn, id).delete();
  }

  async delete(filter: CrudFilter<ID, ROW>): Promise<number> {
    return this.knex(this.table)
      .modify((queryBuilder) => {
        this.applyFilter(queryBuilder, filter);
      })
      .delete();
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

  protected applyFilter(queryBuilder: Knex.QueryBuilder, filter?: CrudFilter<ID, RowType>) {
    if (!filter) {
      return;
    }
    const { exclude, include, min, max, since, until } = filter;
    if (exclude) {
      for (const [key, value] of Object.entries(exclude)) {
        if (canExactMatch(value)) {
          queryBuilder.whereNot(this.columnName(key), value);
        } else if (canExactMatchIn(value)) {
          queryBuilder.whereNotIn(this.columnName(key), value as Array<any>);
        } else if (isNull(value)) {
          queryBuilder.whereNotNull(this.columnName(key));
        }
      }
    }
    if (include) {
      for (const [key, value] of Object.entries(include)) {
        if (canExactMatch(value)) {
          queryBuilder.where(this.columnName(key), value);
        } else if (canExactMatchIn(value)) {
          queryBuilder.whereIn(this.columnName(key), value as Array<any>);
        } else if (isNull(value)) {
          queryBuilder.whereNull(this.columnName(key));
        }
      }
    }
    if (canExactMatch(min)) {
      queryBuilder.where(this.columnName(this.idColumn), '>=', min ? min : null);
    }
    if (canExactMatch(max)) {
      queryBuilder.where(this.columnName(this.idColumn), '<', max ? max : null);
    }
    if (canExactMatch(since)) {
      queryBuilder.where(this.columnName(this.createdAtColumn), '>=', since ? since : null);
    }
    if (canExactMatch(until)) {
      queryBuilder.where(this.columnName(this.updatedAtColumn), '<', until ? until : null);
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
          [SortOrder.DEFAULT]: 'ASC',
          [SortOrder.ASC]: 'ASC',
          [SortOrder.DESC]: 'DESC',
        }[sort.order]
      );
    }
  }

  protected columnName(name: string): string {
    return `${this.table}.${name}`;
  }
}
