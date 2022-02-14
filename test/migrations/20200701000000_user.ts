import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('user', (t) => {
    t.integer('id').primary();
    t.string('type').notNullable().defaultTo('');
    t.string('state').notNullable().defaultTo('');
    t.timestamps();
    t.string('email').notNullable().unique();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('user');
}
