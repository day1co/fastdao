import { SortOrder, parseSort, parseSorts } from './sort';

describe('sort', () => {
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
