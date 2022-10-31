// import type { IdType, RowType } from '../crud.type';
// import { Sort } from '../sort';
// import { canExactMatch, canExactMatchIn, isNull } from '../util';

// import { CustomObject, CrudFilter } from '../crud-operations.interface';
// import { CustomObject, CrudFilterColumns } from '../crud-operations.interface';

import type { IdType, RowType } from '../crud.type';
import { Relation } from '../relation';
import { Sort } from '../sort';
import { canExactMatch, canExactMatchIn, isNull } from '../util';
import { Weaver } from '../weaver';

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
} from '../crud-operations.interface';

export type SelectOptions = {
  limit?: number;
  skip?: number;
  sort?: CustomObject;
};

interface ExtensionsOpts {
  idColumn?: string;
  createdAtColumn?: string;
  updatedAtColumn?: string;
}

export class Extensions<ID extends IdType = number, ROW extends RowType = RowType> {
  public readonly idColumn: string;
  public readonly createdAtColumn: string;
  public readonly updatedAtColumn: string;

  constructor({ idColumn, createdAtColumn, updatedAtColumn }: ExtensionsOpts) {
    this.idColumn = idColumn ?? '_id';
    this.createdAtColumn = createdAtColumn ?? 'created_at';
    this.updatedAtColumn = updatedAtColumn ?? 'updated_at';
  }

  //---------------------------------------------------------
  // extension point
  protected applyFilter(filter?: CrudFilter<ID, ROW>): CustomObject {
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
