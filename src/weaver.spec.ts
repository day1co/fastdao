import redisMock from 'redis-mock';
import { FastCache } from '@fastcampus/fastcache';
import { connect } from './connection';
import { Weaver } from './weaver';
import { parseRelations } from './relation';

const KNEX_OPTS = {
  client: 'sqlite3',
  connection: {
    filename: ':memory:',
  },
  useNullAsDefault: true,
};

const cache = FastCache.create({ redis: {}, createRedisClient: redisMock.createClient });

describe('weaver', () => {
  let knex;

  beforeAll(async () => {
    knex = connect(KNEX_OPTS);
    await knex.migrate.latest({ directory: './test/migrations' });
  });

  afterAll(async () => {
    await knex.destroy();
  });

  beforeEach(async () => {
    await knex.seed.run({ directory: './test/seeds' });
  });

  describe('weave', () => {
    it('should weave', async () => {
      const rr = Weaver.create({ knex, cache });
      const posts = await knex('post').select();
      console.log('posts:', posts);
      const postsWithRels = await rr.weave(posts, parseRelations('forum,user'));
      console.log('postsWithRels:', postsWithRels);
      for (const post of postsWithRels) {
        expect(post.forum).toEqual(await knex('forum').where({ id: post.forumId }).first());
        expect(post.user).toEqual(await knex('user').where({ id: post.userId }).first());
      }
      console.log(rr.cacheStat);
    });
    it('should weave nothing', async () => {
      const rr = Weaver.create({ knex, cache });
      expect(await rr.weave()).toBeUndefined();
      expect(await rr.weave(undefined, [])).toBeUndefined();
      expect(await rr.weave(null, [])).toBeNull();
      expect(await rr.weave([])).toEqual([]);
      expect(await rr.weave([], parseRelations('foo,bar,baz,qux'))).toEqual([]);
      expect(await rr.weave([], null)).toEqual([]);
      expect(await rr.weave([], [])).toEqual([]);
    });
    it('should throw', async () => {
      const rr = Weaver.create({ knex, cache });
      await expect(rr.weave(knex('comment').select(), parseRelations('not_found'))).rejects.toThrow();
    });
  });
});
