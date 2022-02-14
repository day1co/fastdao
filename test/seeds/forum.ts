import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('forum').truncate();

  await knex('forum').insert([
    { id: 1, type: 'FORUM', state: 'NORMAL', title: 'f1', description: 'f1 u1', user_id: 1 },
    { id: 2, type: 'FORUM', state: 'NORMAL', title: 'f2', description: 'f2 u2', user_id: 2 },
    { id: 3, type: 'FORUM', state: 'DELETED', title: 'f3', description: 'f3 u3', user_id: 3 },
  ]);
}
