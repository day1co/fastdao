export function escapeIdentifier(identifier: string): string {
  return '`' + identifier + '`';
}

export function escapeLiteral(literal: unknown): string {
  switch (typeof literal) {
    case 'string':
      return '"' + literal.replace('"', '""') + '"';
    case 'function':
      return (literal as Function)();
    case 'number':
      return String(literal);
    default:
      if (Array.isArray(literal)) {
        return '(' + (literal as Array<unknown>).map(escapeLiteral).join(',') + ')';
      }
      if (literal instanceof Date) {
        const s = literal.toISOString();
        return `"${s.substring(0, 10)} ${s.substring(11, 19)}"`;
      }
      throw new TypeError(`unsupported literal type: ${typeof literal}`);
  }
}

export function escapeValue(value: unknown): string {
  switch (typeof value) {
    case 'symbol':
      try {
        const identifier = Symbol.keyFor(value as symbol) as string;
        return escapeIdentifier(identifier);
      } catch (e: unknown) {
        throw new TypeError(`invalid identifier symbol: ${String(value)}`);
      }
    case 'function':
      try {
        return (value as Function)();
      } catch (e: unknown) {
        throw new TypeError(`invalid raw value: ${String(value)}`);
      }
    default:
      return escapeLiteral(value);
  }
}

export function SQL(strings: ReadonlyArray<string>, ...values: Array<unknown>): string {
  let result = '';
  for (let i = 0, len = values.length; i < len; i += 1) {
    result += strings[i];
    result += escapeValue(values[i]);
  }
  result += strings[strings.length - 1];
  return result;
}

// for mysql query function
// https://github.com/mysqljs/mysql#performing-queries
// import { QueryOptions } from '@types/mysql';
export function MYSQL(strings: ReadonlyArray<string>, ...values: Array<unknown>) {
  const result = { sql: '', values: Array<unknown>() };
  for (let i = 0, len = values.length; i < len; i += 1) {
    const value = values[i];
    result.sql += strings[i];
    switch (typeof value) {
      case 'symbol':
        result.sql += '??';
        result.values.push(Symbol.keyFor(value) as string);
        break;
      case 'function':
        result.sql += (value as Function)();
        break;
      default:
        result.sql += '?';
        result.values.push(value);
        break;
    }
  }
  return result;
}

// for pg query function
// https://node-postgres.com/features/queries
// import { QueryConfig } from '@types/pg';
export function PG(strings: ReadonlyArray<string>, ...values: Array<unknown>) {
  const result = { text: '', values: Array<unknown>() };
  for (let i = 0, len = values.length, paramIndex = 0; i < len; i += 1) {
    const value = values[i];
    result.text += strings[i];
    switch (typeof value) {
      case 'symbol':
        // PG didn't support placeholder for escape identifier
        result.text += escapeIdentifier(Symbol.keyFor(value as symbol) as string);
        break;
      case 'function':
        result.text += (value as Function)();
        break;
      default:
        paramIndex += 1;
        result.text += '$' + paramIndex;
        result.values.push(value);
        break;
    }
  }
  return result;
}
