import { Knex } from 'knex';
import type { IdType, RowType } from '../crud.type';

import { MysqlCrudOperationsOpts, InsertOperations } from '../crud-operations.interface';
import { Extensions } from './extensions';

export class InsertOps<ID extends IdType = number, ROW extends RowType = RowType>
  extends Extensions<ID, ROW>
  implements InsertOperations<ROW>
{
  public readonly knex: Knex | Knex.Transaction;
  public readonly knexReplica: Knex | Knex.Transaction;

  constructor(opts: MysqlCrudOperationsOpts<ID, ROW>) {
    super(opts); // table, idColumn, created(updated)AtColumn : support extends
    this.knex = opts.knex;
    this.knexReplica = opts.knexReplica || opts.knex;
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
}
