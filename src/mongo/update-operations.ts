import type { IdType, RowType } from '../crud.type';
import { Relation } from '../relation';
import { Sort } from '../sort';
import { canExactMatch, canExactMatchIn, isNull } from '../util';
import { Weaver } from '../weaver';

export { Schema } from 'mongoose';

import { CustomObject, CrudFilter, MongoCrudOperationsOpts, UpdateOperations } from '../crud-operations.interface';

export type SelectOptions = {
  limit?: number;
  skip?: number;
  sort?: CustomObject;
};

import { Extensions } from './extensions';

export class UpdateOps<ID extends IdType = number, ROW extends RowType = RowType>
  extends Extensions<ID, ROW>
  implements UpdateOperations<ID, ROW>
{
  public readonly model: any;

  constructor(opts: MongoCrudOperationsOpts<ID, ROW>) {
    super(opts);
    this.model = opts.mongo.model(opts.table, opts.schema);
  }

  //---------------------------------------------------------
  // UpdateOperation

  async updateById(id: ID, data: Partial<ROW>): Promise<number> {
    const filter = {
      [this.idColumn]: id,
    };
    return this.model.updateOne(filter, data);
  }

  async update(filter: CrudFilter<ID, ROW>, data: Partial<ROW>): Promise<number> {
    const convertFilter = filter ? this.applyFilter(filter) : {};
    if (Array.isArray(data)) {
      return this.model.updateMany(convertFilter, data);
    } else {
      return this.model.updateOne(convertFilter, data);
    }
  }
}
