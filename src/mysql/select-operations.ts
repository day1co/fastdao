import { Knex } from 'knex';
import type { IdType, RowType } from '../crud.type';
import { Relation } from '../relation';
import { Sort } from '../sort';
import { Weaver } from '../weaver';

import { CrudFilterColumns, CrudFilter, MysqlCrudOperationsOpts, SelectOperations } from '../crud-operations.interface';
import { Extensions } from './extensions';

export class SelectOps<ID extends IdType = number, ROW extends RowType = RowType>
  extends Extensions<ID, ROW>
  implements SelectOperations<ID, ROW>
{
  public readonly knex: Knex | Knex.Transaction;
  public readonly knexReplica: Knex | Knex.Transaction;
  private readonly weaver?: Weaver<ID, ROW>;

  constructor(opts: MysqlCrudOperationsOpts<ID, ROW>) {
    super(opts); // table, idColumn, created(updated)AtColumn : support extends
    this.knex = opts.knex; // 합쳐야 되는데 귀찮다..
    this.knexReplica = opts.knexReplica || opts.knex;
    this.weaver = opts.weaver;
  }

  //---------------------------------------------------------
  // SelectOperation

  async select(filter?: CrudFilter<ID, ROW>, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<Array<ROW>> {
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
    filter?: CrudFilter<ID, ROW>,
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
    const include = { [this.idColumn]: id } as CrudFilterColumns<ROW>;
    return this.selectFirst({ include }, undefined, relations);
  }
}
