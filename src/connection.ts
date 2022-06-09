import knex, { Knex } from 'knex';
import { toCamelCaseKeys, toSnakeCase } from '@day1co/fastcase';

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

export const connect = (config: Knex.Config): Knex => {
  const knexInstance = knex({ ...config, postProcessResponse, wrapIdentifier });
  process.on('exit', () => knexInstance.destroy());
  return knexInstance;
};

export { Knex } from 'knex';
