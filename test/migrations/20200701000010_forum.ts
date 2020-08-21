import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('forum', (t) => {
    t.integer('id').primary();
    t.string('type').notNullable().defaultTo('');
    t.string('state').notNullable().defaultTo('');
    t.timestamps();
    t.string('title').notNullable();
    t.string('description');
    t.integer('user_id').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('forum');
}
