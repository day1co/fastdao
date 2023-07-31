import IORedisMock from 'ioredis-mock';
import { FastCache } from '@day1co/fastcache';
import { Knex } from 'knex';
import { connect } from './connection';
import { Weaver } from './weaver';
import { parseSorts } from './sort';
import { parseRelations } from './relation';
import { CrudOperations } from './crud-operations';
import * as knexOpts from '../test/knexfile';

const cache = FastCache.create({ redis: {}, createRedisClient: () => new IORedisMock() });

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userCrud = CrudOperations.create({ knex, table: 'user', weaver });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    it('should select with include filter', async () => {
      const rows = await postCrud.select({ include: { id: 2 } });
      expect(rows).toMatchObject(await knex('post').where('id', 2).select());
    });
    it('should select with include filter by normal array', async () => {
      const rows = await postCrud.select({ include: { id: [1, 2, 3] } });
      expect(rows).toMatchObject(await knex('post').whereIn('id', [1, 2, 3]).select());
      expect(rows).toHaveLength(3);
    });
    it('should select with include/exclude filter by normal array', async () => {
      const rows = await postCrud.select({ include: { id: [1, 2, 3] }, exclude: { id: [2] } });
      expect(rows).toMatchObject(await knex('post').whereIn('id', [1, 3]).select());
      expect(rows).toHaveLength(2);
    });
    it('should select with include filter by empty array', async () => {
      const rows = await postCrud.select({ include: { id: [] } });
      expect(rows).toMatchObject(await knex('post').whereIn('id', []).select());
      expect(rows).toHaveLength(0);
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
      const rows = await postCrud.select(undefined, parseSorts('-id'));
      expect(rows).toMatchObject(await knex('post').orderBy('id', 'DESC').select());
    });
    it('should select with relations', async () => {
      const rows = await postCrud.select(undefined, undefined, parseRelations('forum,user'));
      for (const row of rows) {
        expect(row.forum).toEqual(await knex('forum').where({ id: row.forum.id }).first());
        expect(row.user).toEqual(await knex('user').where({ id: row.user.id }).first());
      }
    });
    it('should select with full contain filter', async () => {
      const postRows = await postCrud.select({ fullContain: { content: 'f1' } });
      expect(postRows).toHaveLength(3);
      expect(postRows).toMatchObject(await knex('post').whereLike('content', `%f1%`));
      expect(postRows).toMatchObject(await knex('post').whereIn('id', [1, 4, 7]).select());

      const forumRows = await forumCrud.select({ fullContain: { description: 'f1' } });
      expect(forumRows).toHaveLength(1);
      expect(forumRows).toMatchObject(await knex('forum').whereLike('description', '%f1%'));
      expect(forumRows).toMatchObject(await knex('forum').where({ id: 1 }));
    });
    it('should select with left side contain filter', async () => {
      const rows = await postCrud.select({ leftContain: { content: 'u1' } });
      expect(rows).toHaveLength(3);
      expect(rows).toMatchObject(await knex('post').whereLike('content', `%u1`));
      expect(rows).toMatchObject(await knex('post').whereIn('id', [1, 2, 3]).select());

      const forumRows = await forumCrud.select({ leftContain: { description: 'u1' } });
      expect(forumRows).toHaveLength(1);
      expect(forumRows).toMatchObject(await knex('forum').whereLike('description', '%u1'));
      expect(forumRows).toMatchObject(await knex('forum').where({ id: 1 }));
    });
    it('should select with right side contain filter', async () => {
      const rows = await postCrud.select({ rightContain: { content: 'p1' } });
      expect(rows).toHaveLength(2);
      expect(rows).toMatchObject(await knex('post').whereLike('content', `p1%`));
      expect(rows).toMatchObject(await knex('post').whereIn('id', [1, 10]).select());

      const forumRows = await forumCrud.select({ rightContain: { description: 'f3' } });
      expect(forumRows).toHaveLength(1);
      expect(forumRows).toMatchObject(await knex('forum').whereLike('description', 'f3%'));
      expect(forumRows).toMatchObject(await knex('forum').where({ id: 3 }));
    });
    it('should select with contain filter', async () => {
      const rows = await postCrud.select({ contain: { content: 'p1' } });
      expect(rows).toHaveLength(2);
      expect(rows).toMatchObject(await knex('post').whereLike('content', `p1%`));
      expect(rows).toMatchObject(await knex('post').whereIn('id', [1, 10]).select());

      const forumRows = await forumCrud.select({ contain: { description: 'f3' } });
      expect(forumRows).toHaveLength(1);
      expect(forumRows).toMatchObject(await knex('forum').whereLike('description', 'f3%'));
      expect(forumRows).toMatchObject(await knex('forum').where({ id: 3 }));
    });

    it('bad use case: should select with contain and right side contain filter', async () => {
      const postRows = await postCrud.select({ rightContain: { content: 'p1' }, contain: { content: 'p1' } });
      expect(postRows).toHaveLength(2);
      expect(postRows).toMatchObject(await knex('post').whereLike('content', `p1%`));
      expect(postRows).toMatchObject(await knex('post').whereIn('id', [1, 10]).select());

      const postRows2 = await postCrud.select({ rightContain: { content: 'p2' }, contain: { content: 'p1' } });
      expect(postRows2).toHaveLength(0);
      expect(postRows2).toMatchObject(await knex('post').whereLike('content', `p2%`).whereLike('content', `p1%`));

      const forumRows = await forumCrud.select({ rightContain: { title: 'f3' }, contain: { description: 'f3' } });
      expect(forumRows).toHaveLength(1);
      expect(forumRows).toMatchObject(await knex('forum').whereLike('description', 'f3%').whereLike('title', 'f3%'));
      expect(forumRows).toMatchObject(await knex('forum').where({ id: 3 }));
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
