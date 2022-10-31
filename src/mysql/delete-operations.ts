import { Knex } from 'knex';
import type { IdType, RowType } from '../crud.type';

import { CrudFilter, MysqlCrudOperationsOpts, DeleteOperations } from '../crud-operations.interface';
import { Extensions } from './extensions';

export class DeleteOps<ID extends IdType = number, ROW extends RowType = RowType>
  extends Extensions<ID, ROW>
  implements DeleteOperations<ID, ROW>
{
  public readonly knex: Knex | Knex.Transaction;
  public readonly knexReplica: Knex | Knex.Transaction;

  constructor(opts: MysqlCrudOperationsOpts<ID, ROW>) {
    super(opts); // table, idColumn, created(updated)AtColumn : support extends
    this.knex = opts.knex;
    this.knexReplica = opts.knexReplica || opts.knex;
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
}
