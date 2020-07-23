import { ExtraOperations } from './extra-operations';
import Knex from 'knex';
import * as knexOpts from '../test/knexfile';

describe('extra-operations', () => {
  let knex: Knex;
  let userExtra: ExtraOperations;

  beforeAll(async () => {
    knex = Knex(knexOpts);
    await knex.migrate.latest({ directory: './test/migrations' });

    userExtra = ExtraOperations.create({ knex, table: 'user_pref', fkColumn: 'user_id' });
  });

  afterAll(async () => {
    await knex.destroy();
  });

  beforeEach(async () => {
    await knex.seed.run({ directory: './test/seeds' });
  });

  describe('selectByName', () => {
    it('should select a value', async () => {
      expect(await userExtra.selectByName(1, 'foo')).toBe('FOO1');
      expect(await userExtra.selectByName(1, 'bar')).toBe('BAR1');
      expect(await userExtra.selectByName(1, 'baz')).toBe('BAZ1');
      expect(await userExtra.selectByName(1, 'qux')).toBe('QUX1');
      expect(await userExtra.selectByName(2, 'foo')).toBe('FOO2');
      expect(await userExtra.selectByName(2, 'bar')).toBe('BAR2');
      expect(await userExtra.selectByName(2, 'baz')).toBe('BAZ2');
      expect(await userExtra.selectByName(3, 'foo')).toBe('FOO3');
      expect(await userExtra.selectByName(3, 'bar')).toBe('BAR3');
      expect(await userExtra.selectByName(4, 'foo')).toBe('FOO4');
    });
    it('should select a value', async () => {
      expect(await userExtra.selectByName(1, 'not_found')).toBeUndefined();
      expect(await userExtra.selectByName(404, 'foo')).toBeUndefined();
    });
  });

  describe('upsertExtra', () => {
    it('should update', async () => {
      await userExtra.upsertExtra(1, 'foo', 'hello');
      expect((await knex('user_pref').where({ user_id: 1, name: 'foo' }).first()).value).toBe('hello');
    });
    it('should insert', async () => {
      await userExtra.upsertExtra(1, 'new', 'hi');
      expect((await knex('user_pref').where({ user_id: 1, name: 'new' }).first()).value).toBe('hi');

      await userExtra.upsertExtra(404, 'new', 'greeting');
      expect((await knex('user_pref').where({ user_id: 404, name: 'new' }).first()).value).toBe('greeting');
    });
  });

  describe('mergeExtras', () => {
    it('should insert/update', async () => {
      await userExtra.mergeExtras(1, { foo: 'update', new: 'insert' });
      expect(new Set(await knex('user_pref').where({ user_id: 1 }).select())).toEqual(
        new Set([
          { user_id: 1, name: 'foo', value: 'update' },
          { user_id: 1, name: 'bar', value: 'BAR1' },
          { user_id: 1, name: 'baz', value: 'BAZ1' },
          { user_id: 1, name: 'qux', value: 'QUX1' },
          { user_id: 1, name: 'new', value: 'insert' },
        ])
      );
    });
  });

  describe('selectExtras', () => {
    it('should select all', async () => {
      const r1 = await userExtra.selectExtras(1);
      console.log(r1);
      expect(r1).toEqual({ foo: 'FOO1', bar: 'BAR1', baz: 'BAZ1', qux: 'QUX1' });
      const r2 = await userExtra.selectExtras(2);
      console.log(r2);
      expect(r2).toEqual({ foo: 'FOO2', bar: 'BAR2', baz: 'BAZ2' });
      const r3 = await userExtra.selectExtras(3);
      console.log(r3);
      expect(r3).toEqual({ foo: 'FOO3', bar: 'BAR3' });
      const r4 = await userExtra.selectExtras(4);
      console.log(r4);
      expect(r4).toEqual({ foo: 'FOO4' });
      const r5 = await userExtra.selectExtras(5);
      console.log(r5);
      expect(r5).toEqual({});
    });
  });

  describe('upsertExtras', () => {
    it('should insert/update/delete', async () => {
      await userExtra.upsertExtras(1, { foo: 'update', new: 'insert' });
      expect(new Set(await knex('user_pref').where({ user_id: 1 }).select())).toEqual(
        new Set([
          { user_id: 1, name: 'foo', value: 'update' },
          { user_id: 1, name: 'new', value: 'insert' },
        ])
      );
    });
  });

  describe('deleteExtras', () => {
    it('should delete', async () => {
      await userExtra.deleteExtras(1, ['foo', 'bar', 'not_found']);
      expect(new Set(await knex('user_pref').where({ user_id: 1 }).select())).toEqual(
        new Set([
          { user_id: 1, name: 'baz', value: 'BAZ1' },
          { user_id: 1, name: 'qux', value: 'QUX1' },
        ])
      );
    });
  });
});
