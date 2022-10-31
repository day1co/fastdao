import type { IdType, RowType } from '../crud.type';

export { Schema } from 'mongoose';

import { CustomObject, MongoCrudOperationsOpts, InsertOperations } from '../crud-operations.interface';

export type SelectOptions = {
  limit?: number;
  skip?: number;
  sort?: CustomObject;
};

import { Extensions } from './extensions';

export class InsertOps<ID extends IdType = number, ROW extends RowType = RowType>
  extends Extensions<ID, ROW>
  implements InsertOperations<ROW>
{
  public readonly model: any;

  constructor(opts: MongoCrudOperationsOpts<ID, ROW>) {
    super(opts);
    this.model = opts.mongo.model(opts.table, opts.schema);
  }

  //---------------------------------------------------------
  // InsertOperation

  async insert(data: ROW | Array<ROW>): Promise<ROW> {
    return this.model.insertMany(data);
  }
}
