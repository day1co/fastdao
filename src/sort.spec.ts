import { SortOrder, sort, sortAsc, sortDesc, parseSort, parseSorts } from './sort';

describe('sort', () => {
  describe('sort', () => {
    it('should create sort object', () => {
      expect(sort('foo')).toEqual({ column: 'foo', order: SortOrder.DEFAULT });
      expect(sort('foo', SortOrder.ASC)).toEqual({ column: 'foo', order: SortOrder.ASC });
      expect(sort('foo', SortOrder.DESC)).toEqual({ column: 'foo', order: SortOrder.DESC });
    });
  });
  describe('sortAsc', () => {
    it('should create sort object with asc', () => {
      expect(sortAsc('foo')).toEqual({ column: 'foo', order: SortOrder.ASC });
    });
  });
  describe('sortDesc', () => {
    it('should create sort object with desc', () => {
      expect(sortDesc('foo')).toEqual({ column: 'foo', order: SortOrder.DESC });
    });
  });
  describe('parseSort', () => {
    it('should parse', () => {
      expect(parseSort('foo')).toMatchObject({ column: 'foo', order: SortOrder.DEFAULT });
      expect(parseSort('+foo')).toMatchObject({ column: 'foo', order: SortOrder.ASC });
      expect(parseSort('-foo')).toMatchObject({ column: 'foo', order: SortOrder.DESC });
      expect(parseSort('-  foo')).toMatchObject({ column: 'foo', order: SortOrder.DESC });
      expect(parseSort('  foo  ')).toMatchObject({ column: 'foo', order: SortOrder.DEFAULT });
      expect(parseSort('  +foo  ')).toMatchObject({ column: 'foo', order: SortOrder.ASC });
      expect(parseSort('  -foo  ')).toMatchObject({ column: 'foo', order: SortOrder.DESC });
      expect(parseSort('  -  foo  ')).toMatchObject({ column: 'foo', order: SortOrder.DESC });
    });
    it('should throw', () => {
      expect(() => parseSort('')).toThrow();
      expect(() => parseSort('  ')).toThrow();
      expect(() => parseSort('+')).toThrow();
      expect(() => parseSort('-')).toThrow();
    });
  });
  describe('parseSorts', () => {
    it('should parse', () => {
      expect(parseSorts('')).toMatchObject([]);
      expect(parseSorts('foo,bar,baz')).toMatchObject([
        { column: 'foo', order: SortOrder.DEFAULT },
        { column: 'bar', order: SortOrder.DEFAULT },
        { column: 'baz', order: SortOrder.DEFAULT },
      ]);
      expect(parseSorts('  foo  ,  bar  ,  baz  ')).toMatchObject([
        { column: 'foo', order: SortOrder.DEFAULT },
        { column: 'bar', order: SortOrder.DEFAULT },
        { column: 'baz', order: SortOrder.DEFAULT },
      ]);
      expect(parseSorts('foo,+bar,-baz')).toMatchObject([
        { column: 'foo', order: SortOrder.DEFAULT },
        { column: 'bar', order: SortOrder.ASC },
        { column: 'baz', order: SortOrder.DESC },
      ]);
      expect(parseSorts('  foo  ,  +bar  ,  -baz')).toMatchObject([
        { column: 'foo', order: SortOrder.DEFAULT },
        { column: 'bar', order: SortOrder.ASC },
        { column: 'baz', order: SortOrder.DESC },
      ]);
    });
    it('should throw', () => {
      expect(() => parseSorts('foo,,baz')).toThrow();
      expect(() => parseSorts('foo,+,baz')).toThrow();
      expect(() => parseSorts('foo,-,baz')).toThrow();
    });
  });
});
