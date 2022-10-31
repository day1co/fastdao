import 'dotenv/config';
import mongoose from 'mongoose';
import { Mongoose } from 'mongoose';
import knex, { Knex } from 'knex';
import { toCamelCaseKeys, toSnakeCase } from '@day1co/fastcase';
import { IdType, RowType } from './crud.type';

import { MongoConfig, CustomObject, FastDaoConfig, ConnectManagerOpts } from './connection.interface';
export { Knex, Mongoose, MongoConfig, FastDaoConfig, ConnectManagerOpts };

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
  } else {
    auth = ``;
    protocol = 'mongodb+srv';
  }
  auth = primary.user && primary.password ? `${primary.user}:${primary.password}@` : ``;
  const url = `${protocol}://${auth}${hostString}/${primary.database}${queryString}`;

  mongoose.set('bufferCommands', true);
  mongoose.connect(url);

  return mongoose;
};

/**
 * 기존 서비스를 위해 유지
 */
export const connect = (config: any): Knex | Mongoose => {
  if ('connection' in config) return knexConnect(config);
  if ('primary' in config) return mongoConnect(config);
  throw Error('잘못된 연결 정보 입니다.');
};

export class ConnectManager {
  public static getConnection<ID extends IdType = number, ROW extends RowType = RowType>(
    opts: ConnectManagerOpts<ID, ROW>
  ): Knex | Mongoose {
    switch (opts.type) {
      case 'mysql':
        if ('connection' in opts.config) {
          if (opts.custom && opts.config.connection) {
            const connection = typeof opts.config.connection == 'object' ? opts.config.connection : {};
            opts.config = {
              ...opts.config,
              connection: {
                ...connection,
                ...opts.custom,
              },
            };
          }
          return knexConnect(opts.config);
        }
      case 'mongo':
        if ('primary' in opts.config) {
          if (opts.custom && opts.config.primary) {
            const primary = opts.config.primary || {};
            opts.config = {
              ...opts.config,
              primary: {
                ...primary,
                ...opts.custom,
              },
            };
          }
          return mongoConnect(opts.config);
        }
    }
    throw new Error('연결할 서비스가 없습니다.');
  }
}
