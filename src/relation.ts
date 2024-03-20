export type RelationType = 'ONE_TO_MANY';
export interface Relation {
  table: string;
  column: string;
  fk: string;
  property: string;
  type?: RelationType;
}

const defaultFk = (table: string, fk?: string) => fk || `${table}Id`;

export function relation(table: string, column = 'id', fk?: string, property?: string, type?: RelationType) {
  return { table, column, fk: fk || defaultFk(table, fk), property: property || table, type };
}

// ex. `user` === `user.id` === `userId=user.id` === `userId=user.id@user`
const REL_TERM_REGEXP = /((\w+)=)?(\w+)(\.(\w+))?(@(\w+))?/;
const REL_TERM_SEPARATOR = ',';

export function parseRelation(s: string): Relation {
  const match = REL_TERM_REGEXP.exec(s.trim());
  if (!match) {
    throw new Error('invalid relation: ' + s);
  }
  return {
    table: match[3],
    column: match[5] || 'id',
    fk: defaultFk(match[3], match[2]),
    property: match[7] || match[3],
  };
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
