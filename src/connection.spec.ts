import { connect } from './connection';
import * as knexOpts from '../test/knexfile';

describe('connection', () => {
  describe('connect', () => {
    it('should connect', () => {
      const knex = connect(knexOpts);
      expect(knex).toBeDefined();
      expect(typeof knex.select).toBe('function');
    });
  });
});

describe('knex extension for mysql', () => {
  let knex;

  beforeAll(async () => {
    knex = connect(knexOpts);
    await knex.migrate.latest({ directory: './test/migrations' });
  });
  afterAll(async () => {
    knex.destroy();
  });

  beforeEach(async () => {
    await knex.seed.run({ directory: './test/seeds' });
  });
  describe('customReplace', () => {
    it('should insert new row', async () => {
      expect(await knex('post').customReplace({ id: 999, title: 'insert', forumId: 1, userId: 2 })).toBeTruthy();
      expect(await knex('post').where({ id: 999 }).first()).toMatchObject({
        id: 999,
        title: 'insert',
        forumId: 1,
        userId: 2,
      });
    });
    it('should update existing row', async () => {
      expect(await knex('post').customReplace({ id: 1, title: 'update', forumId: 3, userId: 4 })).toBeTruthy();
      expect(await knex('post').where({ id: 1 }).first()).toMatchObject({
        id: 1,
        title: 'update',
        forumId: 3,
        userId: 4,
      });
    });
  });
  describe('customUpsert', () => {
    it('should insert new row', async () => {
      expect(await knex('post').customUpsert({ id: 999, title: 'insert', forumId: 1, userId: 2 })).toBeTruthy();
      expect(await knex('post').where({ id: 999 }).first()).toMatchObject({
        id: 999,
        title: 'insert',
        forumId: 1,
        userId: 2,
      });
    });
    it('should update existing row', async () => {
      expect(await knex('post').customUpsert({ id: 1, title: 'update', forumId: 3, userId: 4 })).toBeTruthy();
      expect(await knex('post').where({ id: 1 }).first()).toMatchObject({
        id: 1,
        title: 'update',
        forumId: 3,
        userId: 4,
      });
    });
  });
});
