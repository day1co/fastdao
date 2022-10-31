import { Knex } from 'knex';
import type { IdType, RowType } from '../crud.type';
import { SortOrder, Sort } from '../sort';
import { canExactMatch, canExactMatchIn, isNull } from '../util';

import { CrudFilter } from '../crud-operations.interface';

interface ExtensionsOpts {
  table: string;
  idColumn?: string;
  createdAtColumn?: string;
  updatedAtColumn?: string;
}
export class Extensions<ID extends IdType = number, ROW extends RowType = RowType> {
  public readonly table: string;
  public readonly idColumn: string;
  public readonly createdAtColumn: string;
  public readonly updatedAtColumn: string;
  constructor({ table, idColumn, createdAtColumn, updatedAtColumn }: ExtensionsOpts) {
    this.table = table;
    this.idColumn = idColumn ?? 'id';
    this.createdAtColumn = createdAtColumn ?? 'created_at';
    this.updatedAtColumn = updatedAtColumn ?? 'updated_at';
  }
  //---------------------------------------------------------
  // extension point

  protected applyFilter(queryBuilder: Knex.QueryBuilder, filter?: CrudFilter<ID, ROW>) {
    if (!filter) {
      return;
    }
    const { exclude, include, min, max, since, until } = filter;
    if (exclude) {
      for (const [key, value] of Object.entries(exclude)) {
        if (canExactMatch(value)) {
          queryBuilder.whereNot(this.columnName(key), value);
        } else if (canExactMatchIn(value)) {
          queryBuilder.whereNotIn(this.columnName(key), value);
        } else if (isNull(value)) {
          queryBuilder.whereNotNull(this.columnName(key));
        }
      }
    }
    if (include) {
      for (const [key, value] of Object.entries(include)) {
        if (canExactMatch(value)) {
          queryBuilder.where(this.columnName(key), value);
        } else if (canExactMatchIn(value)) {
          queryBuilder.whereIn(this.columnName(key), value);
        } else if (isNull(value)) {
          queryBuilder.whereNull(this.columnName(key));
        }
      }
    }
    if (canExactMatch(min)) {
      queryBuilder.where(this.columnName(this.idColumn), '>=', min ? min : null);
    }
    if (canExactMatch(max)) {
      queryBuilder.where(this.columnName(this.idColumn), '<', max ? max : null);
    }
    if (canExactMatch(since)) {
      queryBuilder.where(this.columnName(this.createdAtColumn), '>=', since ? since : null);
    }
    if (canExactMatch(until)) {
      queryBuilder.where(this.columnName(this.updatedAtColumn), '<', until ? until : null);
    }
  }

  protected applySort(queryBuilder: Knex.QueryBuilder, sorts?: Array<Sort>) {
    if (!sorts || !sorts.length) {
      return;
    }
    for (const sort of sorts) {
      queryBuilder.orderBy(
        this.columnName(sort.column),
        {
          [SortOrder.DEFAULT]: 'ASC',
          [SortOrder.ASC]: 'ASC',
          [SortOrder.DESC]: 'DESC',
        }[sort.order]
      );
    }
  }

  protected columnName(name: string): string {
    return `${this.table}.${name}`;
  }
}
