import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user_pref', (t) => {
    t.integer('user_id').notNullable();
    t.string('name').notNullable();
    t.string('value');
    t.primary(['user_id', 'name']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user_pref');
}
