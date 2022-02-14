import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('user').truncate();

  await knex('user').insert([
    { id: 1, type: 'USER', state: 'NORMAL', email: 'u1@test.com' },
    { id: 2, type: 'USER', state: 'NORMAL', email: 'u2@test.com' },
    { id: 3, type: 'USER', state: 'DELETED', email: 'u3@test.com' },
  ]);
}
