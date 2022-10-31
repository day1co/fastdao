import type { IdType, RowType } from '../crud.type';
import { Relation } from '../relation';
import { Sort } from '../sort';

import {
  MongoCrudOperationsOpts,
  SelectOperations,
  InsertOperations,
  UpdateOperations,
  DeleteOperations,
  CrudFilter,
} from '../crud-operations.interface';

import { SelectOps } from './select-operations';
import { InsertOps } from './insert-operations';
import { UpdateOps } from './update-operations';
import { DeleteOps } from './delete-operations';

export class CrudOps<ID extends IdType = number, ROW extends RowType = RowType>
  implements SelectOperations<ID, ROW>, InsertOperations<ROW>, UpdateOperations<ID, ROW>, DeleteOperations<ID, ROW>
{
  private readonly selectOps: SelectOps<ID, ROW>;
  private readonly insertOps: InsertOps<ID, ROW>;
  private readonly updateOps: UpdateOps<ID, ROW>;
  private readonly deleteOps: DeleteOps<ID, ROW>;
  constructor(opts: MongoCrudOperationsOpts<ID, ROW>) {
    this.selectOps = new SelectOps(opts);
    this.insertOps = new InsertOps(opts);
    this.updateOps = new UpdateOps(opts);
    this.deleteOps = new DeleteOps(opts);
  }
  //---------------------------------------------------------
  // SelectOperation
  async select(filter?: CrudFilter<ID, ROW>, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<Array<ROW>> {
    return this.selectOps.select(filter, sorts, relations);
  }

  async count(filter?: CrudFilter<ID, ROW>): Promise<number> {
    return this.selectOps.count(filter);
  }

  async selectFirst(
    filter?: CrudFilter<ID, ROW>,
    sorts?: Array<Sort>,
    relations?: Array<Relation>
  ): Promise<ROW | undefined> {
    return this.selectOps.selectFirst(filter, sorts, relations);
  }

  async exist(filter?: CrudFilter<ID, ROW>): Promise<boolean> {
    return this.selectOps.exist(filter);
  }

  async selectById(id: ID, relations?: Array<Relation>): Promise<ROW | undefined> {
    return this.selectOps.selectById(id, relations);
  }
  //---------------------------------------------------------
  // InsertOperation
  async insert(data: ROW | Array<ROW>): Promise<ROW> {
    return this.insertOps.insert(data);
  }
  //---------------------------------------------------------
  // UpdateOperation
  async updateById(id: ID, data: Partial<ROW>): Promise<number> {
    return this.updateOps.updateById(id, data);
  }

  async update(filter: CrudFilter<ID, ROW>, data: Partial<ROW>): Promise<number> {
    return this.updateOps.update(filter, data);
  }
  //---------------------------------------------------------
  // DeleteOperation
  async deleteById(id: ID): Promise<number> {
    return this.deleteOps.deleteById(id);
  }

  async delete(filter: CrudFilter<ID, ROW>): Promise<number> {
    return this.deleteOps.delete(filter);
  }
}
