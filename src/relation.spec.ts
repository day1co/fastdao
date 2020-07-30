import { relation, parseRelation, parseRelations } from './relation';

describe('relation', () => {
  describe('relation', () => {
    it('should create relation object', () => {
      expect(relation('table')).toEqual({ table: 'table', column: 'id', fk: 'tableId', property: 'table' });
      expect(relation('table', 'column')).toEqual({
        table: 'table',
        column: 'column',
        fk: 'tableId',
        property: 'table',
      });
      expect(relation('table', 'column', 'fk')).toEqual({
        table: 'table',
        column: 'column',
        fk: 'fk',
        property: 'table',
      });
      expect(relation('table', 'column', 'fk', 'property')).toEqual({
        table: 'table',
        column: 'column',
        fk: 'fk',
        property: 'property',
      });
    });
  });
  describe('parseRelation', () => {
    it('should parse', () => {
      expect(parseRelation('table')).toEqual({ table: 'table', column: 'id', fk: 'tableId', property: 'table' });
      expect(parseRelation('table.column')).toEqual({
        table: 'table',
        column: 'column',
        fk: 'tableId',
        property: 'table',
      });
      expect(parseRelation('fk=table')).toEqual({ table: 'table', column: 'id', fk: 'fk', property: 'table' });
      expect(parseRelation('fk=table.column')).toEqual({
        table: 'table',
        column: 'column',
        fk: 'fk',
        property: 'table',
      });
      expect(parseRelation('fk=table.column@property')).toEqual({
        table: 'table',
        column: 'column',
        fk: 'fk',
        property: 'property',
      });
      expect(parseRelation('  table  ')).toEqual({ table: 'table', column: 'id', fk: 'tableId', property: 'table' });
      expect(parseRelation('  table.column  ')).toEqual({
        table: 'table',
        column: 'column',
        fk: 'tableId',
        property: 'table',
      });
      expect(parseRelation('  fk=table  ')).toEqual({ table: 'table', column: 'id', fk: 'fk', property: 'table' });
      expect(parseRelation('  fk=table.column  ')).toEqual({
        table: 'table',
        column: 'column',
        fk: 'fk',
        property: 'table',
      });
      expect(parseRelation('  fk=table.column@property  ')).toEqual({
        table: 'table',
        column: 'column',
        fk: 'fk',
        property: 'property',
      });
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
      expect(parseRelations('table,table.column,fk=table,fk=table.column,fk=table.column@property')).toEqual([
        { table: 'table', column: 'id', fk: 'tableId', property: 'table' },
        { table: 'table', column: 'column', fk: 'tableId', property: 'table' },
        { table: 'table', column: 'id', fk: 'fk', property: 'table' },
        { table: 'table', column: 'column', fk: 'fk', property: 'table' },
        { table: 'table', column: 'column', fk: 'fk', property: 'property' },
      ]);
      expect(parseRelations('  table,table.column,fk=table,fk=table.column,fk=table.column@property  ')).toEqual([
        { table: 'table', column: 'id', fk: 'tableId', property: 'table' },
        { table: 'table', column: 'column', fk: 'tableId', property: 'table' },
        { table: 'table', column: 'id', fk: 'fk', property: 'table' },
        { table: 'table', column: 'column', fk: 'fk', property: 'table' },
        { table: 'table', column: 'column', fk: 'fk', property: 'property' },
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
