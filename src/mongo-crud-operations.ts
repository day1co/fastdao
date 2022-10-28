import type { IdType, RowType } from './crud.type';
import { Relation } from './relation';
import { Sort } from './sort';
import { canExactMatch, canExactMatchIn, isNull } from './util';
import { Weaver } from './weaver';

export { Schema } from 'mongoose';

import {
  CustomObject,
  CrudFilterColumns,
  CrudFilter,
  MongoCrudOperationsOpts,
  SelectOperations,
  InsertOperations,
  UpdateOperations,
  DeleteOperations,
} from './crud-operations.interface';

export type SelectOptions = {
  limit?: number;
  skip?: number;
  sort?: CustomObject;
};

export class MongoCrudOperations<ID extends IdType = number, ROW extends RowType = RowType>
  implements SelectOperations<ID, ROW>, InsertOperations<ROW>, UpdateOperations<ID, ROW>, DeleteOperations<ID, ROW>
{
  public readonly model: any;
  private readonly idColumn: string;
  private readonly createdAtColumn: string;
  private readonly updatedAtColumn: string;
  private readonly weaver?: Weaver<ID, ROW>;

  constructor(opts: MongoCrudOperationsOpts<ID, ROW>) {
    this.model = opts.mongo.model(opts.table, opts.schema);
    this.idColumn = opts.idColumn ?? '_id';
    this.createdAtColumn = opts.createdAtColumn ?? 'created_at';
    this.updatedAtColumn = opts.updatedAtColumn ?? 'updated_at';
    // for relations
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

  async selectById(id: ID, relations?: Array<Relation>): Promise<ROW | undefined> {
    const include = { [this.idColumn]: id } as CrudFilterColumns<ROW>;
    return this.selectFirst({ include }, undefined, relations);
  }

  //---------------------------------------------------------
  // InsertOperation

  async insert(data: ROW | Array<ROW>): Promise<ROW> {
    return this.model.insertMany(data);
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

  //---------------------------------------------------------
  // extension point

  protected applyFilter(filter: CrudFilter<ID, ROW>): CustomObject {
    const condition: CustomObject = {};
    if (!filter) return condition;
    const { exclude, include, min, max, since, until, customCondition } = filter;
    if (exclude) {
      for (const [key, value] of Object.entries(exclude)) {
        if (canExactMatch(value)) {
          condition[key] = { $ne: value };
        } else if (canExactMatchIn(value)) {
          condition[key] = { $nin: value };
        } else if (isNull(value)) {
          condition[key] = { $ne: null };
        }
      }
    }
    if (include) {
      for (const [key, value] of Object.entries(include)) {
        if (canExactMatch(value)) {
          condition[key] = { $eq: value };
        } else if (canExactMatchIn(value)) {
          condition[key] = { $in: value };
        } else if (isNull(value)) {
          condition[key] = { $eq: null };
        }
      }
    }
    if (canExactMatch(min)) condition[this.idColumn] = { $gte: min };
    if (canExactMatch(max)) condition[this.idColumn] = { $lt: max };
    if (canExactMatch(since)) condition[this.createdAtColumn] = { $gte: since };
    if (canExactMatch(until)) condition[this.updatedAtColumn] = { $lt: until };
    return customCondition ? { ...condition, ...customCondition } : condition;
  }

  protected applySort(sorts: Sort[]) {
    if (!sorts?.length) return;
    return sorts.reduce((result: CustomObject, sort) => {
      result[sort.column] = sort.order;
      return result;
    }, {});
  }
}
