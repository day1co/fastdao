import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('user_pref').truncate();

  await knex('user_pref').insert([
    { user_id: 1, name: 'foo', value: 'FOO1' },
    { user_id: 1, name: 'bar', value: 'BAR1' },
    { user_id: 1, name: 'baz', value: 'BAZ1' },
    { user_id: 1, name: 'qux', value: 'QUX1' },
    { user_id: 2, name: 'foo', value: 'FOO2' },
    { user_id: 2, name: 'bar', value: 'BAR2' },
    { user_id: 2, name: 'baz', value: 'BAZ2' },
    { user_id: 3, name: 'foo', value: 'FOO3' },
    { user_id: 3, name: 'bar', value: 'BAR3' },
    { user_id: 4, name: 'foo', value: 'FOO4' },
  ]);
}
