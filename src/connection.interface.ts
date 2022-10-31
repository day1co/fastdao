import { Knex } from 'knex';
import { Schema, Mongoose } from 'mongoose';
import type { IdType, RowType } from './crud.type';
import { Weaver } from './weaver';

export interface Primary {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  query?: {
    [key: string]: string | boolean;
  };
}
export interface Secondary {
  host: string;
  port?: number;
}
export type MongoConfig = {
  primary: Primary;
  secondary?: [Secondary];
  arbiter?: [Secondary];
};

export interface CustomObject {
  [x: string | symbol]: any;
}

export type FastDaoConfig = Knex.Config | MongoConfig;

export interface ConnectManagerOpts<ID extends IdType = number, ROW extends RowType = RowType> {
  type: 'mysql' | 'mongo';
  config: Knex.Config | MongoConfig; // redstone-config style
  options?: {
    table: string;
    idColumn?: string;
    createdAtColumn?: string;
    updatedAtColumn?: string;
    weaver?: Weaver<ID, ROW>;
  };
  schema?: Schema; // for mongo
  custom?: {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
  };
}
