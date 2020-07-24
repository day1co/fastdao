import redisMock from 'redis-mock';
import { FastCache } from '@fastcampus/fastcache';
import Knex from 'knex';
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
    knex = Knex(knexOpts);
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
      console.log(rows);
      expect(rows).toMatchObject(await knex('post').select());
    });
    it('should select with filter', async () => {
      const rows = await postCrud.select({ include: { id: [1, 2, 3] }, exclude: { id: [2] } });
      console.log(rows);
      expect(rows).toMatchObject(await knex('post').whereIn('id', [1, 3]).select());
    });
    it('should select with sort', async () => {
      const rows = await postCrud.select(null, parseSorts('-id'));
      console.log(rows);
      expect(rows).toMatchObject(await knex('post').orderBy('id', 'DESC').select());
    });
    it('should select with relations', async () => {
      const rows = await postCrud.select(null, null, parseRelations('forum,user'));
      console.log(rows);
      for (const row of rows) {
        expect(row.forum).toEqual(await knex('forum').where({ id: row.forum.id }).first());
        expect(row.user).toEqual(await knex('user').where({ id: row.user.id }).first());
      }
    });
  });
  describe('count', () => {
    it('should count all', async () => {
      const count = await postCrud.count();
      console.log(count);
      expect(count).toBe((await knex('post').count())[0]['count(*)']);
    });
    it('should count with filter', async () => {
      const count = await postCrud.count({ include: { id: [1, 2, 3] }, exclude: { id: [2] } });
      console.log(count);
      expect(count).toBe((await knex('post').whereIn('id', [1, 3]).count())[0]['count(*)']);
    });
  });
  describe('selectFirst', () => {
    it('should select the first', async () => {
      const row = await postCrud.selectFirst();
      console.log(row);
      expect(row).toMatchObject(await knex('post').first());
    });
    it('should select the first one', async () => {
      const row = await postCrud.selectFirst({ include: { title: 'p1' } });
      console.log(row);
      expect(row).toMatchObject(await knex('post').where({ title: 'p1' }).first());
    });
    it('should select the first one even if deleted', async () => {
      const row = await postCrud.selectFirst({ include: { id: 3 } });
      console.log(row);
      expect(row).toMatchObject(await knex('post').where({ id: 3 }).first());
    });
  });
  describe('selectById', () => {
    it('should select by id', async () => {
      const row = await postCrud.selectById(1);
      console.log(row);
      expect(row).toMatchObject(await knex('post').where({ id: 1 }).first());
    });
    it('should select by id even if deleted', async () => {
      const row = await postCrud.selectById(3);
      console.log(row);
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
        forum_id: 1,
        user_id: 1,
      });
      console.log(row);
      expect(row).toMatchObject(await knex('post').first({ id: 999 }));
    });
    it('should insert new rows', async () => {
      const newRows = [
        {
          id: 997,
          type: 'type997',
          state: 'new',
          title: 'title997',
          forum_id: 1,
          user_id: 2,
        },
        {
          id: 998,
          type: 'type998',
          state: 'new',
          title: 'title998',
          content: 'content998',
          forum_id: 3,
          user_id: 1,
        },
        {
          id: 999,
          type: 'type999',
          state: 'new',
          title: 'title999',
          forum_id: 2,
          user_id: 3,
        },
      ];
      const row = await postCrud.insert(newRows);
      console.log(row);
      const rows = await knex('post').where({ state: 'new' }).select();
      // mysql: the first one, sqlite3: the last one, ...
      expect(rows).toContainEqual(row);
      expect(rows).toMatchObject(newRows);
    });
  });
  describe('updateById', () => {
    it('should update by id', async () => {
      await postCrud.updateById(1, { state: 'update' });
      const row = await knex('post').where({ id: 1 }).first();
      console.log(row);
      expect(row).toMatchObject({
        id: 1,
        state: 'update',
      });
    });
  });
  describe('deleteById', () => {
    it('should delete by id', async () => {
      await postCrud.deleteById(1);
      const row = await knex('post').where({ id: 1 }).first();
      console.log(row);
      expect(row).toBeUndefined();
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
