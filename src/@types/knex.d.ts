import { Knex as KnexOriginal } from 'knex';
import { ObjectType } from '@day1co/pebbles';

declare module 'knex' {
  namespace Knex {
    interface QueryBuilder {
      customReplace<TRecord, TResult>(data: ObjectType): KnexOriginal.QueryBuilder<TRecord, TResult>;
      customUpsert<TRecord, TResult>(data: ObjectType): KnexOriginal.QueryBuilder<TRecord, TResult>;
    }
  }
}
