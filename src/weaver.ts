import { Knex } from 'knex';
import { FastCache } from '@day1co/fastcache';
import { LoggerFactory } from '@day1co/pebbles';
import type { Logger } from '@day1co/pebbles';
import { IdType, RowType } from './crud.type';
import { Relation } from './relation';

export interface WeaverOpts {
  knex: Knex;
  cache?: FastCache;
}

export class Weaver<ID extends IdType = number, ROW extends RowType = RowType> {
  private readonly knex: Knex;
  private readonly cache: FastCache;
  private readonly logger: Logger;
  public readonly cacheStat = { hit: 0, miss: 0 };

  static create<ID extends IdType = number, ROW extends RowType = RowType>(opts: WeaverOpts) {
    return new Weaver<ID, ROW>(opts);
  }

  private constructor(opts: WeaverOpts) {
    this.knex = opts.knex;
    this.cache = opts.cache || FastCache.create();
    this.logger = LoggerFactory.getLogger('fastdao:weaver');
  }

  async weave(rows?: Array<Required<ROW>>, relations?: Array<Relation>): Promise<Array<Required<ROW>>> {
    if (!rows || rows.length === 0 || !relations || relations.length === 0) {
      // nothing to weave
      return [];
    }
    const relationsRows = await Promise.all(
      relations.map((relation) =>
        this.selectRelationByIds(
          relation,
          rows.map((row) => row[relation.fk]).filter((id) => !!id)
        )
      )
    );
    for (let rowIndex = 0, rowCount = rows.length; rowIndex < rowCount; rowIndex += 1) {
      const row: RowType = rows[rowIndex];
      for (let relationIndex = 0, relationCount = relations.length; relationIndex < relationCount; relationIndex += 1) {
        const relation = relations[relationIndex];
        const fkValue = row[relation.fk];
        if (fkValue) {
          const relationRows = relationsRows[relationIndex];
          // TODO: better search algorithm: binary search or else...
          for (
            let relationRowIndex = 0, relationRowCount = relationRows.length;
            relationRowIndex < relationRowCount;
            relationRowIndex += 1
          ) {
            const relRow = relationRows[relationRowIndex];
            if (fkValue === relRow[relation.column]) {
              row[relation.property] = relRow;
              break;
            }
          }
        }
      }
    }
    return rows;
  }

  async selectRelationByIds(relation: Relation, ids: Array<ID>): Promise<Array<Required<ROW>>> {
    const missedIds: Array<ID> = [];
    const hitRows: Array<Required<ROW>> = [];
    if (this.cache) {
      const cached: Array<string | null> =
        ids && ids.length ? await this.cache.getAll(ids.map((id) => relation.table + ':' + id)) : [];
      for (let i = 0, count = ids.length; i < count; i += 1) {
        if (cached[i] !== null) {
          hitRows.push(JSON.parse(<string>cached[i]));
          this.logger.trace(`cache hit: ${relation.table}, id=${ids[i]}`);
          this.cacheStat.hit += 1;
        } else {
          missedIds.push(ids[i]);
          this.logger.warn(`cache miss: ${relation.table}, id=${ids[i]}`);
          this.cacheStat.miss += 1;
        }
      }
    }
    const result = await this.knex(relation.table)
      .whereIn(relation.column, this.cache ? missedIds : ids)
      .select();
    if (this.cache && result && result.length) {
      setImmediate(() => {
        const cacheItems = result.reduce((cacheItems, row) => {
          const key = relation.table + ':' + row[relation.column];
          cacheItems[key] = JSON.stringify(row);
          return cacheItems;
        }, {});
        this.cache
          .setAll(cacheItems)
          .then((result) => this.logger.debug('cache setAll ok: %o', result))
          .catch((err) => this.logger.error('cache setAll err: %o', err));
      });
    }
    // this.logger.debug('cache stat: %o', this.cacheStat);
    return hitRows.concat(result);
  }

  async flushCache(table: string, id = '*') {
    const pattern = `${table}:${id}`;
    this.logger.debug(`flush cache: ${pattern}`);
    return this.cache.flush(pattern);
  }
}
