function isPrimitive(value) {
  return typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean';
}

function isIterable(value) {
  return value && value[Symbol.iterator];
}

export interface SqlTemplateAdapter {
  readonly idMarker: string;
  readonly paramMarker: string;
  readonly alwaysFailExpression: string;
  escapeId(id: string): string;
  escapeLiteral(literal: string): string;
  toQueryOptions(sql: string, values: Array<any>): any;
}

export class MysqlAdapter implements SqlTemplateAdapter {
  get idMarker() {
    return '??';
  }

  get paramMarker() {
    return '?';
  }

  get alwaysFailExpression() {
    return '(0=1)';
  }

  escapeId(id) {
    return '`' + id + '`';
  }

  escapeLiteral(literal) {
    return literal;
  }

  toQueryOptions(sql, values) {
    return { sql, values };
  }
}

export class SqlTemplate {
  private adapter: SqlTemplateAdapter;
  constructor({ adapter }) {
    this.adapter = adapter;
  }

  sql(strings, ...values) {
    console.log('s:', strings);
    console.log('v:', values);
    const terms = [];
    const params = [];
    for (let i = 0, len = strings.length; i < len; i += 1) {
      const term = strings[i];
      const value = values[i];
      console.log(`#${i}: term=/${term}/ value=/${value}/`);
      if (isPrimitive(value) || value instanceof Date) {
        // sql`id=${1}`
        // {sql: 'id=?', values: [1]}
        terms.push(term, this.adapter.paramMarker);
        params.push(value);
      } else if (isIterable(value) && value.length > 0) {
        // sql`id IN ${[1,2,3]}`
        // {sql: 'id IN (?,?,?)', values: [1,2,3]}
        terms.push(term, '(', Array(value.length).fill(this.adapter.paramMarker).join(','), ')');
        params.push(...value);
      } else if (typeof value === 'object') {
        // TODO: more...
        const subTerms = [];
        for (const [k, v] of Object.entries(value)) {
          // sql`WHERE ${a:1,b:null,c:undefined}`
          // {sql: 'WHERE (??=? AND ?? IS NULL)', values: ['a', 1, 'b']}
          if (v === null) {
            subTerms.push(`${this.adapter.idMarker} IS NULL`);
            params.push(k);
          } else if (isPrimitive(v)) {
            subTerms.push(`${this.adapter.idMarker}=${this.adapter.paramMarker}`);
            params.push(k, v);
          } else {
          }
        }
        if (subTerms.length > 0) {
          terms.push(term, '(', subTerms.join(' AND '), ')');
        } else {
          terms.push(term, this.adapter.alwaysFailExpression);
        }
      } else {
        // typeof value === 'number' || typeof value === 'string' || value instanceof Date
      }
    }
    return this.adapter.toQueryOptions(terms.join(''), params);
  }

  id(id) {
    return this.adapter.escapeId(id);
  }

  literal(id) {
    return this.adapter.escapeLiteral(id);
  }

  isNull(id) {
    return this.adapter.toQueryOptions('(?? IS NULL)', [id]);
  }

  isNotNull(id) {
    return this.adapter.toQueryOptions('(?? IS NOT NULL)', [id]);
  }

  lessThan(id, value) {
    return this.adapter.toQueryOptions('(?? < ?)', [id, value]);
  }

  lt(id, value) {
    return this.lessThan(id, value);
  }

  lessThanOrEqualTo(id, value) {
    return this.adapter.toQueryOptions('(?? <= ?)', [id, value]);
  }

  lte(id, value) {
    return this.lessThanOrEqualTo(id, value);
  }

  greaterThan(id, value) {
    return this.adapter.toQueryOptions('(?? > ?)', [id, value]);
  }

  gt(id, value) {
    return this.greaterThan(id, value);
  }

  greaterThanOrEqualTo(id, value) {
    return this.adapter.toQueryOptions('(?? >= ?)', [id, value]);
  }

  gte(id, value) {
    return this.greaterThanOrEqualTo(id, value);
  }

  like(id, value) {
    return this.adapter.toQueryOptions('(?? LIKE ?)', [id, value]);
  }

  notLike(id, value) {
    return this.adapter.toQueryOptions('(?? NOT LIKE ?)', [id, value]);
  }

  between(id, min, max) {
    return this.adapter.toQueryOptions('(?? BETWEEN ? AND ?)', [id, min, max]);
  }

  notBetween(id, min, max) {
    return this.adapter.toQueryOptions('(?? NOT BETWEEN ? AND ?)', [id, min, max]);
  }
}
