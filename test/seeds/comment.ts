import * as Knex from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('comment').truncate();

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
