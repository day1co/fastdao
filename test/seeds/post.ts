import * as Knex from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('post').truncate();

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
}
