import { parseRelation, parseRelations } from './relation';
import { parseSort, parseSorts } from './sort';

describe('relation', () => {
  describe('parseRelation', () => {
    it('should parse', () => {
      expect(parseRelation('foo')).toEqual({ fk: 'fooId', table: 'foo', column: 'id', property: 'foo' });
      expect(parseRelation('bar.baz')).toEqual({ fk: 'barId', table: 'bar', column: 'baz', property: 'bar' });
      expect(parseRelation('foo=bar')).toEqual({ fk: 'foo', table: 'bar', column: 'id', property: 'bar' });
      expect(parseRelation('foo=bar.baz')).toEqual({ fk: 'foo', table: 'bar', column: 'baz', property: 'bar' });
      expect(parseRelation('foo=bar.baz@qux')).toEqual({ fk: 'foo', table: 'bar', column: 'baz', property: 'qux' });
      expect(parseRelation('  foo  ')).toEqual({ fk: 'fooId', table: 'foo', column: 'id', property: 'foo' });
      expect(parseRelation('  bar.baz  ')).toEqual({ fk: 'barId', table: 'bar', column: 'baz', property: 'bar' });
      expect(parseRelation('  foo=bar  ')).toEqual({ fk: 'foo', table: 'bar', column: 'id', property: 'bar' });
      expect(parseRelation('  foo=bar.baz  ')).toEqual({ fk: 'foo', table: 'bar', column: 'baz', property: 'bar' });
      expect(parseRelation('  foo=bar.baz@qux  ')).toEqual({ fk: 'foo', table: 'bar', column: 'baz', property: 'qux' });
    });
    it('should throw', () => {
      expect(() => parseRelation('  ')).toThrow();
      expect(() => parseRelation('')).toThrow();
      expect(() => parseRelation('=')).toThrow();
      expect(() => parseRelation('.')).toThrow();
      expect(() => parseRelation('@')).toThrow();
    });
  });
  describe('parseRelations', () => {
    it('should parse', () => {
      expect(parseRelations('')).toMatchObject([]);
      expect(parseRelations('  foo,bar.baz,foo=bar,foo=bar.baz,foo=bar.baz@qux  ')).toEqual([
        { fk: 'fooId', table: 'foo', column: 'id', property: 'foo' },
        { fk: 'barId', table: 'bar', column: 'baz', property: 'bar' },
        { fk: 'foo', table: 'bar', column: 'id', property: 'bar' },
        { fk: 'foo', table: 'bar', column: 'baz', property: 'bar' },
        { fk: 'foo', table: 'bar', column: 'baz', property: 'qux' },
      ]);
    });
    it('should throw', () => {
      expect(() => parseRelations('foo,,baz')).toThrow();
      expect(() => parseRelations('foo,=,baz')).toThrow();
      expect(() => parseRelations('foo,.,baz')).toThrow();
      expect(() => parseRelations('foo,@,baz')).toThrow();
    });
  });
});
