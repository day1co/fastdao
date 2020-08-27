export const canExactMatch = (value) => {
  return Number.isInteger(value) || typeof value === 'string' || value instanceof Date;
};

export const canExactMatchIn = (value) => {
  return Array.isArray(value) && value.length > 0 && value.every((it) => canExactMatch(it));
};

export const isNull = (value) => {
  return value === null;
};
