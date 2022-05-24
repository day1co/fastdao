import { Knex } from 'knex';
import type { ObjectType } from '@day1co/pebbles';
import { IdType } from './crud.type';

export interface ExtraOperationsOpts {
  knex: Knex;
  knexReplica?: Knex;
  table: string;
  fkColumn: string;
  nameColumn?: string;
  valueColumn?: string;
}

/**
 * **key-value** storage operations on RDBMS table.
 *
 * ex. wordpress wp_postmeta, wp_commentmeta, wp_usermeta tables
 *
 * ```js
 * ExtraOperations.create({
 *   knex,
 *   table: 'wp_postmeta',
 *   fkColumn: 'post_id',
 *   nameColumn: 'meta_key',
 *   valueColumn: 'meta_value',
 * });
 * ```
 */
export class ExtraOperations<ID extends IdType = number> {
  static create<ID extends IdType>(opts: ExtraOperationsOpts) {
    return new ExtraOperations<ID>(opts);
  }

  private readonly knex: Knex;
  private readonly knexReplica: Knex;
  private readonly table: string;
  private readonly fkColumn: string;
  private readonly nameColumn: string;
  private readonly valueColumn: string;

  private constructor(opts: ExtraOperationsOpts) {
    this.knex = opts.knex;
    this.knexReplica = opts.knexReplica || opts.knex;
    this.table = opts.table;
    this.fkColumn = opts.fkColumn;
    this.nameColumn = opts.nameColumn || 'name';
    this.valueColumn = opts.valueColumn || 'value';
  }

  // 개별 조회
  async selectByName(id: ID, name: string) {
    const row = await this.knexReplica(this.table)
      .where({ [this.fkColumn]: id, name })
      .first(this.valueColumn);
    if (row) {
      return row[this.valueColumn];
    }
    return undefined;
  }

  // 개별 추가/갱신
  async upsertExtra(id: ID, name: string, value: unknown) {
    return this.knex(this.table).customReplace({
      [this.fkColumn]: id,
      [this.nameColumn]: name,
      [this.valueColumn]: value,
    });
  }

  // 일괄 병합(추가,갱신만)
  async mergeExtras(id: ID, extras: ObjectType) {
    return this.knex(this.table).customReplace(
      Object.entries(extras).map(([name, value]) => ({
        [this.fkColumn]: id,
        [this.nameColumn]: name,
        [this.valueColumn]: value,
      }))
    );
  }

  // 일괄 조회
  async selectExtras(id: ID) {
    const rows = await this.knexReplica(this.table).where(this.fkColumn, id).select(this.nameColumn, this.valueColumn);
    const result: ObjectType = {};
    for (const row of rows) {
      result[row[this.nameColumn]] = row[this.valueColumn];
    }
    return result;
  }

  // 일괄 추가,갱신 그리고 삭제
  async upsertExtras(id: ID, extras: ObjectType) {
    return this.knex.transaction(async (tx) => {
      await this.knex(this.table)
        .transacting(tx)
        .customReplace(
          Object.entries(extras).map(([name, value]) => ({
            [this.fkColumn]: id,
            [this.nameColumn]: name,
            [this.valueColumn]: value,
          }))
        );
      await this.knex(this.table)
        .transacting(tx)
        .where(this.fkColumn, id)
        .whereNotIn(this.nameColumn, Object.keys(extras))
        .delete();
    });
  }

  // 일괄 삭제
  async deleteExtras(id: ID, names: string[]) {
    return this.knex(this.table)
      .where((qb) => {
        qb.where(this.fkColumn, id);
        if (Array.isArray(names) && names.length > 0) {
          qb.whereIn(this.nameColumn, names);
        }
      })
      .where(this.fkColumn, id)
      .delete();
  }
}
