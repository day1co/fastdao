export const canExactMatch = (value: unknown): value is Date | number | string => {
  return Number.isInteger(value) || typeof value === 'string' || value instanceof Date;
};

export const canExactMatchIn = (value: unknown): value is Array<any> => {
  // XXX: knex 1.0.x  이후 empty array 에 대해 where in () 대신 where 1 = 0 을 생성하여
  //  항상 where 필터가 동작하도록 변경
  // https://github.com/knex/knex/issues/2897
  return Array.isArray(value);
};

export const isNull = (value: unknown): value is null => {
  return value === null;
};
