import Debug from 'debug';
import Knex from 'knex';
import { FastCache } from '@fastcampus/fastcache';
import { Relation } from './relation';

const debug = Debug('fastdao:weaver');

export interface WeaverOpts {
  knex: Knex;
  cache?: FastCache;
}

export class Weaver<ROW extends {} = any> {
  private readonly knex: Knex;
  private readonly cache: FastCache;
  public readonly cacheStat = { hit: 0, miss: 0 };

  static create(opts: WeaverOpts) {
    return new Weaver(opts);
  }

  private constructor(opts: WeaverOpts) {
    this.knex = opts.knex;
    this.cache = opts.cache || FastCache.create();
  }

  async weave<T>(rows?: Array<ROW>, relations?: Array<Relation>): Promise<Array<ROW>> {
    if (!rows || rows.length === 0 || !relations || relations.length === 0) {
      // nothing to weave
      return rows;
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
      const row = rows[rowIndex];
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

  async selectRelationByIds(relation: Relation, ids: Array<ROW>): Promise<Array<ROW>> {
    const missedIds = [];
    const hitRows = [];
    if (this.cache) {
      const cached = ids && ids.length ? await this.cache.getAll(ids.map((id) => relation.table + ':' + id)) : [];
      for (let i = 0, count = ids.length; i < count; i += 1) {
        if (cached[i]) {
          hitRows.push(JSON.parse(cached[i]));
          debug('cache hit:', relation.table, ids[i]);
          this.cacheStat.hit += 1;
        } else {
          missedIds.push(ids[i]);
          debug('cache miss:', relation.table, ids[i]);
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
          .then((result) => debug('cache setAll ok', result))
          .catch((err) => debug('cache setAll err', err));
      });
    }
    // debug('cache stat:', cacheStat);
    return hitRows.concat(result);
  }

  async flushCache(table: string, id = '*') {
    debug('flush cache:', table + ':' + id);
    return this.cache.flush(table + ':' + id);
  }
}
