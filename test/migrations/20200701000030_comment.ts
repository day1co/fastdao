import * as Knex from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('comment', (t) => {
    t.integer('id').primary();
    t.string('type').notNullable().defaultTo('');
    t.string('state').notNullable().defaultTo('');
    t.timestamps();
    t.string('content');
    t.integer('post_id').notNullable();
    t.integer('user_id').notNullable();
    //t.foreign('post_id').references('id').inTable('post');
    //t.foreign('user_id').references('id').inTable('user');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('comment');
}
