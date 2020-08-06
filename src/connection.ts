import Knex from 'knex';
import { toCamelCaseKeys, toSnakeCase } from '@fastcampus/fastcase';

declare module 'knex' {
  interface QueryBuilder {
    customReplace<TRecord, TResult>(data: any): Knex.QueryBuilder<TRecord, TResult>;
    customUpsert<TRecord, TResult>(data: any): Knex.QueryBuilder<TRecord, TResult>;
  }
}

// REPLACE INTO table(col1,col2,...) VALUES(val1,val2,...)
Knex.QueryBuilder.extend('customReplace', function (data) {
  return this.client.raw(
    this.insert(data)
      .toString()
      .replace(/^INSERT/i, 'REPLACE')
  );
});

// INSERT INTO table(col1,col2,....) VALUES(val1,val2,...) ON DUPLICATE KEY UPDATE col1=val1,col2=val2...;
Knex.QueryBuilder.extend('customUpsert', function (data, updateData?) {
  const upsertClause = /^mysql/i.test(this.client.dialect)
    ? ' ON DUPLICATE KEY UPDATE '
    : ` ON CONFLICT(${Object.keys(data).join(',')}) DO UPDATE SET `;
  const insertClause = this.insert(data).toString();
  const updateClause = this.update(updateData || data)
    .toString()
    .replace(/^UPDATE .* SET/i, '');
  return this.client.raw(`${insertClause} ${upsertClause} ${updateClause}`);
});

const postProcessResponse = (result) => toCamelCaseKeys(result);

const wrapIdentifier = (value, dialectImpl) => dialectImpl(toSnakeCase(value));

export const connect = (config: Knex.Config): Knex => {
  const knex = Knex({ ...config, postProcessResponse, wrapIdentifier });
  process.on('exit', () => knex.destroy());
  return knex;
};
