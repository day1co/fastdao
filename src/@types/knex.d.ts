import { Knex as KnexOriginal } from 'knex';

declare module 'knex' {
  namespace Knex {
    interface QueryBuilder {
      customReplace<TRecord, TResult>(data: any): KnexOriginal.QueryBuilder<TRecord, TResult>;
      customUpsert<TRecord, TResult>(data: any): KnexOriginal.QueryBuilder<TRecord, TResult>;
    }
  }
}
