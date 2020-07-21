import Knex from 'knex';
import { toCamelCaseKeys, toSnakeCase } from '@fastcampus/fastcase';

const postProcessResponse = (result) => toCamelCaseKeys(result);

const wrapIdentifier = (value, dialectImpl) => dialectImpl(toSnakeCase(value));

export const connect = (config: Knex.Config): Knex => {
  const knex = Knex({ ...config, postProcessResponse, wrapIdentifier });
  process.on('exit', () => knex.destroy());
  return knex;
};
