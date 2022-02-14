import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('post', (t) => {
    t.integer('id').primary();
    t.string('type').notNullable().defaultTo('');
    t.string('state').notNullable().defaultTo('');
    t.timestamps();
    t.string('title').notNullable();
    t.string('content');
    t.integer('forum_id').notNullable();
    t.integer('user_id').notNullable();
    t.integer('linked_post_id').nullable();
    //t.foreign('forum_id').references('id').inTable('forum');
    //t.foreign('user_id').references('id').inTable('user');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('post');
}
