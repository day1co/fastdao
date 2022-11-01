import type { IdType, RowType } from '../crud.type';
import { Relation } from '../relation';
import { Sort } from '../sort';
import { Weaver } from '../weaver';

export { Schema } from 'mongoose';

import {
  CustomObject,
  CrudFilterColumns,
  CrudFilter,
  MongoCrudOperationsOpts,
  SelectOperations,
} from '../crud-operations.interface';

export type SelectOptions = {
  limit?: number;
  skip?: number;
  sort?: CustomObject;
};

import { Extensions } from './extensions';

export class SelectOps<ID extends IdType = number, ROW extends RowType = RowType>
  extends Extensions<ID, ROW>
  implements SelectOperations<ID, ROW>
{
  public readonly model: any;
  private readonly weaver?: Weaver<ID, ROW>;

  constructor(opts: MongoCrudOperationsOpts<ID, ROW>) {
    super(opts);
    this.model = opts.mongo.model(opts.table, opts.schema);
    this.weaver = opts.weaver;
  }

  //---------------------------------------------------------
  // SelectOperation

  async select(filter?: CrudFilter<ID, ROW>, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<Array<ROW>> {
    const options: SelectOptions = {};

    if (filter?.offset !== undefined && filter?.offset > 0) {
      options.skip = filter?.offset;
    }
    if (filter?.limit !== undefined && filter?.limit > 0) {
      options.limit = filter?.limit;
    }
    if (sorts?.length) options.sort = this.applySort(sorts);
    const convertFilter = filter ? this.applyFilter(filter) : {};

    const projection = filter?.projection || {};
    const rows = this.model.find(convertFilter, projection, options);

    if (relations && relations.length > 0 && this.weaver) {
      return this.weaver.weave(await rows, relations);
    }

    return rows;
  }

  async count(filter?: CrudFilter<ID, ROW>): Promise<number> {
    const convertFilter = filter ? this.applyFilter(filter) : {};
    return this.model.countDocuments(convertFilter);
    // return rows[0]['count(*)'];
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

  async selectById(id: ID | string, relations?: Array<Relation>): Promise<ROW | undefined> {
    const include = { [this.idColumn]: id } as CrudFilterColumns<ROW>;
    return this.selectFirst({ include }, undefined, relations);
  }
}
