import { ConnectManager, Mongoose, ConnectManagerOpts } from './connection';
import type { IdType, RowType } from './crud.type';
import { MysqlCrudOperationsOpts, MongoCrudOperationsOpts } from './crud-operations.interface';
import { Knex } from 'knex';
import {
  SelectOps as MysqlSelectOps,
  InsertOps as MysqlInsertOps,
  UpdateOps as MysqlUpdateOps,
  DeleteOps as MysqlDeleteOps,
  TransactingOps as MysqlTransactingOps,
  CrudOps as MysqlCrudOps,
} from './mysql';

import {
  SelectOps as MongoSelectOps,
  InsertOps as MongoInsertOps,
  UpdateOps as MongoUpdateOps,
  DeleteOps as MongoDeleteOps,
  CrudOps as MongoCrudOps,
} from './mongo';

export class OperationFactory<ID extends IdType = number, ROW extends RowType = RowType> {
  private readonly opts: ConnectManagerOpts<ID, ROW>;
  private service: Knex | Mongoose | null;
  private mongoOpts: MongoCrudOperationsOpts<ID, ROW> | null;
  private mysqlOpts: MysqlCrudOperationsOpts<ID, ROW> | null;
  constructor(opts: ConnectManagerOpts<ID, ROW>) {
    this.opts = opts;
    this.service = null;
    this.mongoOpts = null;
    this.mysqlOpts = null;
    this.start();
  }
  private start() {
    if (!this.service) this.service = ConnectManager.getConnection(this.opts);
    if (this.service instanceof Mongoose && this.opts.schema && this.opts.options?.table) {
      this.mongoOpts = {
        mongo: this.service,
        schema: this.opts.schema,
        ...this.opts.options,
      };
    }
    if (this.opts.type == 'mysql' && typeof this.service == 'function' && this.opts.options?.table) {
      this.mysqlOpts = {
        knex: this.service,
        ...this.opts.options,
      };
    }
  }
  getSelectOps() {
    if (this.service instanceof Mongoose && this.opts.schema && this.opts.options?.table) {
      if (this.mongoOpts) return new MongoSelectOps(this.mongoOpts);
    }
    if (this.opts.type == 'mysql' && typeof this.service == 'function' && this.opts.options?.table) {
      if (this.mysqlOpts) return new MysqlSelectOps(this.mysqlOpts);
    }
    throw new Error('no selected service');
  }
  getInsertOps() {
    if (this.service instanceof Mongoose && this.opts.schema && this.opts.options?.table) {
      if (this.mongoOpts) return new MongoInsertOps(this.mongoOpts);
    }
    if (this.opts.type == 'mysql' && typeof this.service == 'function' && this.opts.options?.table) {
      if (this.mysqlOpts) return new MysqlInsertOps(this.mysqlOpts);
    }
    throw new Error('no selected service');
  }
  getUpdateOps() {
    if (this.service instanceof Mongoose && this.opts.schema && this.opts.options?.table) {
      if (this.mongoOpts) return new MongoUpdateOps(this.mongoOpts);
    }
    if (this.opts.type == 'mysql' && typeof this.service == 'function' && this.opts.options?.table) {
      if (this.mysqlOpts) return new MysqlUpdateOps(this.mysqlOpts);
    }
    throw new Error('no selected service');
  }
  getDeleteOps() {
    if (this.service instanceof Mongoose && this.opts.schema && this.opts.options?.table) {
      if (this.mongoOpts) return new MongoDeleteOps(this.mongoOpts);
    }
    if (this.opts.type == 'mysql' && typeof this.service == 'function' && this.opts.options?.table) {
      if (this.mysqlOpts) return new MysqlDeleteOps(this.mysqlOpts);
    }
    throw new Error('no selected service');
  }
  getTransactingOps() {
    if (this.service instanceof Mongoose && this.opts.schema && this.opts.options?.table) {
      if (this.mongoOpts) throw new Error('mongo not support transacting');
    }
    if (this.opts.type == 'mysql' && typeof this.service == 'function' && this.opts.options?.table) {
      if (this.mysqlOpts) return new MysqlTransactingOps(this.mysqlOpts);
    }
    throw new Error('no selected service');
  }
  getCrudOps() {
    if (this.service instanceof Mongoose && this.opts.schema && this.opts.options?.table) {
      if (this.mongoOpts) return new MongoCrudOps(this.mongoOpts);
    }
    if (this.opts.type == 'mysql' && typeof this.service == 'function' && this.opts.options?.table) {
      if (this.mysqlOpts) return new MysqlCrudOps(this.mysqlOpts);
    }
    throw new Error('no selected service');
  }
}
