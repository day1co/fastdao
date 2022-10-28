import { Mongoose, Schema } from 'mongoose';
import { Knex } from 'knex';
import { Weaver } from './weaver';
import { Relation } from './relation';
import type { IdType, RowType } from './crud.type';
import { SortOrder, Sort } from './sort';

export interface CustomObject {
  [key: string]: any;
}

export interface MongoCrudOperationsOpts<ID extends IdType = number, ROW extends RowType = RowType> {
  mongo: Mongoose; // mongo set secondary
  schema: Schema;
  table: string;
  idColumn?: string;
  createdAtColumn?: string;
  updatedAtColumn?: string;
  weaver?: Weaver<ID, ROW>;
}
export interface MysqlCrudOperationsOpts<ID extends IdType = number, ROW extends RowType = RowType> {
  knex: Knex; // 읽기/쓰기 연결
  knexReplica?: Knex; // 읽기 전용 연결
  table: string;
  idColumn?: string;
  createdAtColumn?: string;
  updatedAtColumn?: string;
  weaver?: Weaver<ID, ROW>;
}

export type CrudOperationsOpts<ID extends IdType = number, ROW extends RowType = RowType> =
  | MysqlCrudOperationsOpts<ID, ROW>
  | MongoCrudOperationsOpts<ID, ROW>;

export type CrudFilterColumns<T> = {
  [K in keyof T]?: T[K] | T[K][];
};

export interface CrudFilter<ID extends IdType = number, ROW extends RowType = RowType> {
  // for exact match
  include?: CrudFilterColumns<ROW>;
  // for exact mismatch
  exclude?: CrudFilterColumns<ROW>;
  //id: ID;
  //type: unknown;
  //state: unknown;
  customCondition?: CustomObject; // for mongo
  min?: ID;
  max?: ID;
  since?: Date | string;
  until?: Date | string;
  offset?: number;
  limit?: number;
  /** @deprecated */
  projection?: Array<string>;
}

export interface SelectOperations<ID extends IdType, ROW extends RowType> {
  select(filter?: CrudFilter<ID, ROW>, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<Array<ROW>>;

  count(filter?: CrudFilter<ID, ROW>): Promise<number>;

  selectFirst(filter?: CrudFilter<ID, ROW>, sorts?: Array<Sort>, relations?: Array<Relation>): Promise<ROW | undefined>;

  exist(filter?: CrudFilter<ID, ROW>): Promise<boolean>;

  selectById(id: ID, relations?: Array<Relation>): Promise<ROW | undefined>;
}

export interface InsertOperations<ROW extends RowType> {
  insert(data: ROW | Array<ROW>): Promise<ROW>;
}

export interface UpdateOperations<ID extends IdType, ROW extends RowType> {
  updateById(id: ID, data: Partial<ROW>): Promise<number>;

  update(filter: CrudFilter<ID, ROW>, data: Partial<ROW>): Promise<number>;
}

export interface DeleteOperations<ID extends IdType, ROW extends RowType> {
  deleteById(id: ID): Promise<number>;

  delete(filter: CrudFilter<ID, ROW>): Promise<number>;
}
