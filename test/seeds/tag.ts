import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('tag').truncate();

  await knex('tag').insert([
    { id: 1, name: 'foo' },
    { id: 2, name: 'bar' },
    { id: 3, name: 'baz' },
    { id: 4, name: 'qux' },
  ]);
}
