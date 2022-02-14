import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('post_tag', (t) => {
    t.integer('post_id').notNullable();
    t.integer('tag_id').notNullable();
    t.primary(['post_id', 'tag_id']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('post_tag');
}
