export const canExactMatch = (value) => {
  return Number.isInteger(value) || typeof value === 'string' || value instanceof Date;
};

export const canExactMatchIn = (value) => {
  return Array.isArray(value) && value.length > 0 && value.every((it) => this.canExactMatch(it));
};
