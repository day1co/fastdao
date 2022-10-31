import { Knex } from 'knex';
import type { IdType, RowType } from '../crud.type';

import { MysqlCrudOperationsOpts } from '../crud-operations.interface';

import { Extensions } from './extensions';

export interface Transacting<ID extends IdType, ROW extends RowType> {
  transacting(tx: Knex.Transaction): TransactingOps<ID, ROW>;
}

export class TransactingOps<ID extends IdType = number, ROW extends RowType = RowType>
  extends Extensions
  implements Transacting<ID, ROW>
{
  [x: string | symbol]: unknown; // XXX: transacting 구현에서의 컴파일 에러를 막기 위한 코드

  public readonly knex: Knex | Knex.Transaction;
  public readonly knexReplica: Knex | Knex.Transaction;

  constructor(opts: MysqlCrudOperationsOpts<ID, ROW>) {
    super(opts);
    this.knex = opts.knex;
    this.knexReplica = opts.knexReplica || opts.knex;
  }

  //---------------------------------------------------------
  // TransactionSupport

  transacting(tx: Knex.Transaction): TransactingOps<ID, ROW> {
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
}
