import type { IdType, RowType } from '../crud.type';

export { Schema } from 'mongoose';

import { CustomObject, CrudFilter, MongoCrudOperationsOpts, DeleteOperations } from '../crud-operations.interface';

export type SelectOptions = {
  limit?: number;
  skip?: number;
  sort?: CustomObject;
};

import { Extensions } from './extensions';

export class DeleteOps<ID extends IdType = number, ROW extends RowType = RowType>
  extends Extensions<ID, ROW>
  implements DeleteOperations<ID, ROW>
{
  public readonly model: any;

  constructor(opts: MongoCrudOperationsOpts<ID, ROW>) {
    super(opts);
    this.model = opts.mongo.model(opts.table, opts.schema);
  }

  //---------------------------------------------------------
  // DeleteOperation

  async deleteById(id: ID): Promise<number> {
    const filter = {
      [this.idColumn]: id,
    };
    return this.model.deleteOne(filter);
  }

  async delete(filter: CrudFilter<ID, ROW>): Promise<number> {
    const convertFilter = filter ? this.applyFilter(filter) : {};
    return this.model.deleteMany(convertFilter);
  }
}
