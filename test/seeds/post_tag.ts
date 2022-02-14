import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  await knex('post_tag').truncate();

  await knex('post_tag').insert([
    { post_id: 1, tag_id: 1 },
    { post_id: 1, tag_id: 2 },
    { post_id: 1, tag_id: 3 },
    { post_id: 1, tag_id: 4 },
    { post_id: 2, tag_id: 1 },
    { post_id: 2, tag_id: 2 },
    { post_id: 2, tag_id: 3 },
    { post_id: 2, tag_id: 4 },
    { post_id: 3, tag_id: 1 },
    { post_id: 3, tag_id: 2 },
    { post_id: 3, tag_id: 3 },
    { post_id: 4, tag_id: 1 },
    { post_id: 4, tag_id: 2 },
    { post_id: 4, tag_id: 3 },
    { post_id: 5, tag_id: 1 },
    { post_id: 5, tag_id: 2 },
    { post_id: 6, tag_id: 1 },
    { post_id: 6, tag_id: 2 },
    { post_id: 7, tag_id: 1 },
    { post_id: 8, tag_id: 1 },
  ]);
}
