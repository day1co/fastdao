import 'dotenv/config';
import mongoose from 'mongoose';
import type { Mongoose } from 'mongoose';
import knex, { Knex } from 'knex';
import { toCamelCaseKeys, toSnakeCase } from '@day1co/fastcase';

import { MongoConfig, CustomObject, FastDaoConfig } from './connection.interface';

export type { Knex, Mongoose, MongoConfig, FastDaoConfig };

const serialize = (obj: CustomObject): string => {
  let str = '';
  Object.keys(obj).map((key: string) => {
    let prefix = '';
    if (obj.hasOwnProperty(key)) {
      if (str.length) prefix = '&';
      str += `${prefix}${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`;
    }
  });
  return str;
};

// REPLACE INTO table(col1,col2,...) VALUES(val1,val2,...)
knex.QueryBuilder.extend('customReplace', function (data) {
  return this.client.raw(
    this.insert(data)
      .toString()
      .replace(/^INSERT/i, 'REPLACE')
  );
});

// INSERT INTO table(col1,col2,....) VALUES(val1,val2,...) ON DUPLICATE KEY UPDATE col1=val1,col2=val2...;
knex.QueryBuilder.extend('customUpsert', function (data, updateData?) {
  const upsertClause = /^mysql/i.test(this.client.dialect)
    ? ' ON DUPLICATE KEY UPDATE '
    : ` ON CONFLICT(id) DO UPDATE SET `;
  const insertClause = this.insert(data).toString();
  const updateClause = this.update(updateData || data)
    .toString()
    .replace(/^UPDATE .* SET/i, '');
  return this.client.raw(`${insertClause} ${upsertClause} ${updateClause}`);
});

const postProcessResponse = (result: string) => toCamelCaseKeys(result);

const wrapIdentifier = (value: string, dialectImpl: Function) => dialectImpl(toSnakeCase(value));

export const knexConnect = (config: Knex.Config): Knex => {
  const knexInstance = knex({ ...config, postProcessResponse, wrapIdentifier });
  process.on('exit', () => knexInstance.destroy());
  return knexInstance;
};

export const mongoConnect = (config: MongoConfig): Mongoose => {
  const { primary, secondary = [] } = config;

  const hosts: [string] = primary.port ? [`${primary.host}:${primary.port}`] : [`${primary.host}`];
  secondary.map((item) => {
    const host = item.port ? `${item.host}:${item.port}` : `${item.host}`;
    hosts.push(host);
  });
  const hostString = hosts.join();

  const queryString = primary.query ? `?${serialize(primary.query)}` : '';

  let auth, protocol;
  if (['localhost', '127.0.0.1', '0.0.0.0'].includes(primary.host)) {
    protocol = 'mongodb';
    auth = `${primary.user}:${primary.password}@`;
  } else {
    auth = ``;
    protocol = 'mongodb+srv';
  }
  const url = `${protocol}://${auth}${hostString}/${primary.database}${queryString}`;
  mongoose.set('bufferCommands', true);
  mongoose.connect(url);
  return mongoose;
};

export const connect = (config: any): Knex | Mongoose | void => {
  if ('connection' in config) return knexConnect(config);
  if ('primary' in config) return mongoConnect(config);
  throw Error('잘못된 연결 정보 입니다.');
};
