import knex, { Knex } from 'knex';
import { toCamelCaseKeys, toSnakeCase } from '@day1co/fastcase';
import { LoggerFactory } from '@day1co/pebbles';
import { createHash } from 'node:crypto';

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

const wrapIdentifier = (value: string, dialectImpl: (value: string) => string) => dialectImpl(toSnakeCase(value));

const logger = LoggerFactory.getLogger('fastdao:connect');

const dataSourceMap: Record<string, Knex> = {};

// TODO: use explicit data source id rather than generate!
function generateDataSourceId(config: any) {
  return createHash('sha256').update(JSON.stringify(config)).digest('base64');
}

export function connect(config: Knex.Config): Knex {
  const id = generateDataSourceId(config);
  const existingDataSource = dataSourceMap[id];
  if (existingDataSource) {
    logger.info('re-use exising connection pool(knex instance): %o', config);
    return existingDataSource;
  }
  const deepCopyConfig = JSON.parse(JSON.stringify(config));
  const knexInstance = knex({ ...deepCopyConfig, postProcessResponse, wrapIdentifier });
  logger.info('create new connection pool(knex instance): %o', config);
  dataSourceMap[id] = knexInstance;
  return knexInstance;
}

process.on('exit', () => {
  logger.info('destroy all connection pools(knex instances)...');
  for (const knexInstance of Object.values(dataSourceMap)) {
    knexInstance.destroy();
  }
});

export type { Knex } from 'knex';
