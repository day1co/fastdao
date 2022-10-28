import { Knex } from 'knex';

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
