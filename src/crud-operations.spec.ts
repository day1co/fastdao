import redisMock from 'redis-mock';
import { FastCache } from '@fastcampus/fastcache';
import * as Knex from 'knex';
import { connect } from './connection';
import { Weaver } from './weaver';
import { parseSorts } from './sort';
import { parseRelations } from './relation';
import { CrudOperations } from './crud-operations';
import * as knexOpts from '../test/knexfile';

const cache = FastCache.create({ redis: {}, createRedisClient: redisMock.createClient });

describe('crud-operations', () => {
  let knex: Knex;
  let userCrud: CrudOperations;
  let forumCrud: CrudOperations;
  let postCrud: CrudOperations;
  let commentCrud: CrudOperations;

  beforeAll(async () => {
    knex = connect(knexOpts);
    await knex.migrate.latest({ directory: './test/migrations' });

    const weaver = Weaver.create({ knex, cache });
    userCrud = CrudOperations.create({ knex, table: 'user', weaver });
    forumCrud = CrudOperations.create({ knex, table: 'forum', weaver });
    postCrud = CrudOperations.create({ knex, table: 'post', weaver });
    commentCrud = CrudOperations.create({ knex, table: 'comment', weaver });
  });

  afterAll(async () => {
    await knex.destroy();
  });

  beforeEach(async () => {
    await knex.seed.run({ directory: './test/seeds' });
  });

  describe('select', () => {
    it('should select all', async () => {
      const rows = await postCrud.select();
      expect(rows).toMatchObject(await knex('post').select());
    });
    it('should select with include/exclude filter', async () => {
      const rows = await postCrud.select({ include: { id: [1, 2, 3] }, exclude: { id: [2] } });
      expect(rows).toMatchObject(await knex('post').whereIn('id', [1, 3]).select());
    });
    it('should select with include/exclude null filter', async () => {
      const rows1 = await postCrud.select({ include: { id: [9, 10], linked_post_id: null } });
      expect(rows1).toMatchObject(await knex('post').whereIn('id', [9]).select());
      const rows2 = await postCrud.select({ include: { id: [9, 10] }, exclude: { linked_post_id: null } });
      expect(rows2).toMatchObject(await knex('post').whereIn('id', [10]).select());
    });
    it('should select with min/max filter', async () => {
      const rows = await postCrud.select({ min: 1, max: 4 });
      expect(rows).toMatchObject(await knex('post').whereIn('id', [1, 2, 3]).select());
    });
    it.skip('should select with since/until filter', async () => {
      const rows = await postCrud.select({ include: { id: [1, 2, 3] }, exclude: { id: [2] } });
      expect(rows).toMatchObject(await knex('post').whereIn('id', [1, 2, 3]).select());
    });
    it('should select with limit/offset filter', async () => {
      const rows = await postCrud.select({ limit: 2, offset: 1 });
      expect(rows).toMatchObject(await knex('post').whereIn('id', [2, 3]).select());
    });
    it('should select with sort', async () => {
      const rows = await postCrud.select(null, parseSorts('-id'));
      expect(rows).toMatchObject(await knex('post').orderBy('id', 'DESC').select());
    });
    it('should select with relations', async () => {
      const rows = await postCrud.select(null, null, parseRelations('forum,user'));
      for (const row of rows) {
        expect(row.forum).toEqual(await knex('forum').where({ id: row.forum.id }).first());
        expect(row.user).toEqual(await knex('user').where({ id: row.user.id }).first());
      }
    });
  });
  describe('count', () => {
    it('should count all', async () => {
      const count = await postCrud.count();
      expect(count).toBe((await knex('post').count())[0]['count(*)']);
    });
    it('should count with include/exclude filter', async () => {
      const count = await postCrud.count({ include: { id: [1, 2, 3] }, exclude: { id: [2] } });
      expect(count).toBe((await knex('post').whereIn('id', [1, 3]).count())[0]['count(*)']);
    });
    it('should count with min/max filter', async () => {
      const count = await postCrud.count({ min: 1, max: 4 });
      expect(count).toBe((await knex('post').whereIn('id', [1, 2, 3]).count())[0]['count(*)']);
    });
    it.skip('should count with since/until filter', async () => {
      const count = await postCrud.count({ since: '', until: '' });
      expect(count).toBe((await knex('post').whereIn('id', [1, 2, 3]).count())[0]['count(*)']);
    });
    it('should count ignore limit/offset', async () => {
      const count = await postCrud.count({ limit: 2, offset: 1 });
      expect(count).toBe((await knex('post').count())[0]['count(*)']);
    });
  });
  describe('selectFirst', () => {
    it('should select the first', async () => {
      const row = await postCrud.selectFirst();
      expect(row).toMatchObject(await knex('post').first());
    });
    it('should select the first one', async () => {
      const row = await postCrud.selectFirst({ include: { title: 'p1' } });
      expect(row).toMatchObject(await knex('post').where({ title: 'p1' }).first());
    });
    it('should select the first one even if deleted', async () => {
      const row = await postCrud.selectFirst({ include: { id: 3 } });
      expect(row).toMatchObject(await knex('post').where({ id: 3 }).first());
    });
    it('should return undefined if not exist', async () => {
      await expect(postCrud.selectFirst({ include: { id: 404 } })).resolves.toBeUndefined();
    });
  });
  describe('exist', () => {
    it('should return true if exist', async () => {
      await expect(postCrud.exist()).resolves.toBe(true);
      await expect(postCrud.exist({ include: { title: 'p1' } })).resolves.toBe(true);
      await expect(postCrud.exist({ include: { id: 3 } })).resolves.toBe(true);
    });
    it('should return false if not exist', async () => {
      await expect(postCrud.exist({ include: { id: 404 } })).resolves.toBe(false);
    });
  });
  describe('selectById', () => {
    it('should select by id', async () => {
      const row = await postCrud.selectById(1);
      expect(row).toMatchObject(await knex('post').where({ id: 1 }).first());
    });
    it('should select by id even if deleted', async () => {
      const row = await postCrud.selectById(3);
      expect(row).toMatchObject(await knex('post').where({ id: 3 }).first());
    });
  });
  describe('insert', () => {
    it('should insert new row', async () => {
      const row = await postCrud.insert({
        id: 999,
        type: 'type',
        state: 'state',
        title: 'title',
        forumId: 1,
        userId: 1,
      });
      expect(row).toMatchObject(await knex('post').first({ id: 999 }));
    });
    it('should insert new rows', async () => {
      const newRows = [
        {
          id: 997,
          type: 'type997',
          state: 'new',
          title: 'title997',
          forumId: 1,
          userId: 2,
        },
        {
          id: 998,
          type: 'type998',
          state: 'new',
          title: 'title998',
          content: 'content998',
          forumId: 3,
          userId: 1,
        },
        {
          id: 999,
          type: 'type999',
          state: 'new',
          title: 'title999',
          forumId: 2,
          userId: 3,
        },
      ];
      const row = await postCrud.insert(newRows);
      const rows = await knex('post').where({ state: 'new' }).select();
      // mysql: the first one, sqlite3: the last one, ...
      expect(rows).toContainEqual(row);
      expect(rows).toMatchObject(newRows);
    });
  });
  describe('updateById', () => {
    it('should update by id', async () => {
      const updated = await postCrud.updateById(1, { state: 'update' });
      expect(updated).toBe(1);
      const row = await knex('post').where({ id: 1 }).first();
      expect(row).toMatchObject({
        id: 1,
        state: 'update',
      });
    });
  });
  describe('update', () => {
    it('should update multiple rows', async () => {
      const updated = await postCrud.update({ include: { forumId: 1 } }, { state: 'update' });
      expect(updated).toBe(3);
      const rows = await knex('post').where({ forumId: 1 });
      rows.forEach((row) => expect(row.state).toBe('update'));
    });
  });
  describe('deleteById', () => {
    it('should delete by id', async () => {
      const deleted = await postCrud.deleteById(1);
      expect(deleted).toBe(1);
      const row = await knex('post').where({ id: 1 }).first();
      expect(row).toBeUndefined();
    });
  });
  describe('delete', () => {
    it('should delete multiple rows', async () => {
      const deleted = await postCrud.delete({ include: { forumId: 1 } });
      expect(deleted).toBe(3);
      const rows = await knex('post').where({ forumId: 1 });
      expect(rows).toEqual([]);
    });
  });
  describe('transacting', () => {
    it('should commit', async () => {
      const tx = await knex.transaction();
      await postCrud.transacting(tx).updateById(1, { state: 'HELLO' });
      await commentCrud.transacting(tx).updateById(1, { state: 'WORLD' });
      tx.commit();
      expect(await knex('post').where({ id: 1 }).first()).toMatchObject({
        id: 1,
        state: 'HELLO',
      });
      expect(await knex('comment').where({ id: 1 }).first()).toMatchObject({
        id: 1,
        state: 'WORLD',
      });
    });
    it('should rollback', async () => {
      const tx = await knex.transaction();
      await postCrud.transacting(tx).updateById(1, { state: 'HELLO' });
      await commentCrud.transacting(tx).updateById(1, { state: 'WORLD' });
      tx.rollback();
      expect(await knex('post').where({ id: 1 }).first()).toMatchObject({
        id: 1,
        state: 'NORMAL',
      });
      expect(await knex('comment').where({ id: 1 }).first()).toMatchObject({
        id: 1,
        state: 'NORMAL',
      });
    });
  });
});
