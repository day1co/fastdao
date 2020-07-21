export interface Relation {
  fk: string;
  table: string;
  column: string;
  property: string;
}

// ex. `user` === `user.id` === `user_id=user.id` === `user_id=user.id@user`
const REL_TERM_REGEXP = /((\w+)=)?(\w+)(\.(\w+))?(@(\w+))?/;
const REL_TERM_SEPARATOR = ',';

export function parseRelation(s: string): Relation {
  const match = REL_TERM_REGEXP.exec(s.trim());
  if (!match) {
    throw new Error('invalid relation: ' + s);
  }
  return match
    ? {
        fk: match[2] || `${match[3]}_id`,
        table: match[3],
        column: match[5] || 'id',
        property: match[7] || match[3],
      }
    : null;
}

export function parseRelations(s?: string): Array<Relation> {
  if (!s) {
    return [];
  }
  return s
    .trim()
    .split(REL_TERM_SEPARATOR)
    .map((it) => parseRelation(it));
}
