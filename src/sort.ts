export enum SortOrder {
  DEFAULT,
  ASC,
  DESC,
}

export interface Sort {
  column: string;
  order: SortOrder;
}

const SORT_TERM_REGEXP = /([+\-]?)\s*(\w+)/;
const SORT_TERM_SEPARATOR = ',';

const SORT_ORDER_PREFIX = { '+': SortOrder.ASC, '-': SortOrder.DESC };

export function parseSort(s: string): Sort {
  const match = SORT_TERM_REGEXP.exec(s.trim());
  if (!match) {
    throw new Error('invalid sort: ' + s);
  }
  return {
    column: match[2],
    order: SORT_ORDER_PREFIX[match[1]] || SortOrder.DEFAULT,
  };
}

export function parseSorts(s?: string): Array<Sort> {
  if (!s) {
    return [];
  }
  return s
    .trim()
    .split(SORT_TERM_SEPARATOR)
    .map((it) => parseSort(it));
}
