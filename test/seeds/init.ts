import * as Knex from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('user').truncate();
  await knex('forum').truncate();
  await knex('post').truncate();
  await knex('comment').truncate();

  await knex('user').insert([
    { id: 1, type: 'USER', state: 'NORMAL', email: 'u1@test.com' },
    { id: 2, type: 'USER', state: 'NORMAL', email: 'u2@test.com' },
    { id: 3, type: 'USER', state: 'DELETED', email: 'u3@test.com' },
  ]);
  await knex('forum').insert([
    { id: 1, type: 'FORUM', state: 'NORMAL', title: 'f1', description: 'f1 u1', user_id: 1 },
    { id: 2, type: 'FORUM', state: 'NORMAL', title: 'f2', description: 'f2 u2', user_id: 2 },
    { id: 3, type: 'FORUM', state: 'DELETED', title: 'f3', description: 'f3 u3', user_id: 3 },
  ]);
  await knex('post').insert([
    { id: 1, type: 'POST', state: 'NORMAL', title: 'p1', content: 'p1 f1 u1', forum_id: 1, user_id: 1 },
    { id: 2, type: 'POST', state: 'NORMAL', title: 'p2', content: 'p2 f2 u1', forum_id: 2, user_id: 1 },
    { id: 3, type: 'POST', state: 'DELETED', title: 'p3', content: 'p3 f3 u1', forum_id: 3, user_id: 1 },
    { id: 4, type: 'POST', state: 'NORMAL', title: 'p4', content: 'p4 f1 u2', forum_id: 1, user_id: 2 },
    { id: 5, type: 'POST', state: 'NORMAL', title: 'p5', content: 'p5 f2 u2', forum_id: 2, user_id: 2 },
    { id: 6, type: 'POST', state: 'DELETED', title: 'p6', content: 'p6 f3 u2', forum_id: 3, user_id: 2 },
    { id: 7, type: 'POST', state: 'NORMAL', title: 'p7', content: 'p7 f1 u3', forum_id: 1, user_id: 3 },
    { id: 8, type: 'POST', state: 'NORMAL', title: 'p8', content: 'p8 f2 u3', forum_id: 2, user_id: 3 },
    { id: 9, type: 'POST', state: 'DELETED', title: 'p9', content: 'p9 f3 u3', forum_id: 3, user_id: 3 },
  ]);
  await knex('comment').insert([
    { id: 1, type: 'COMMENT', state: 'NORMAL', content: 'c1 p1 u1', post_id: 1, user_id: 1 },
    { id: 2, type: 'COMMENT', state: 'NORMAL', content: 'c2 p2 u1', post_id: 2, user_id: 1 },
    { id: 3, type: 'COMMENT', state: 'DELETED', content: 'c3 p3 u1', post_id: 3, user_id: 1 },
    { id: 4, type: 'COMMENT', state: 'NORMAL', content: 'c4 p4 u2', post_id: 1, user_id: 2 },
    { id: 5, type: 'COMMENT', state: 'NORMAL', content: 'c5 p5 u2', post_id: 2, user_id: 2 },
    { id: 6, type: 'COMMENT', state: 'DELETED', content: 'c6 p6 u2', post_id: 3, user_id: 2 },
    { id: 7, type: 'COMMENT', state: 'NORMAL', content: 'c7 p7 u3', post_id: 1, user_id: 3 },
    { id: 8, type: 'COMMENT', state: 'NORMAL', content: 'c8 p8 u3', post_id: 2, user_id: 3 },
    { id: 9, type: 'COMMENT', state: 'DELETED', content: 'c9 p9 u3', post_id: 3, user_id: 3 },
  ]);
}
