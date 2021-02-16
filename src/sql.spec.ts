import { SqlTemplate, MysqlAdapter } from './sql';

describe('SqlTemplate', () => {
  const sqlTemplate = new SqlTemplate({ adapter: new MysqlAdapter() });
  const sql = sqlTemplate.sql.bind(sqlTemplate);

  describe('sql', () => {
    it('interpolate primitive', () => {
      expect(sql`id=${1}`).toEqual({
        sql: 'id=?',
        values: [1],
      });
      expect(sql`name=${'abc'}`).toEqual({
        sql: 'name=?',
        values: ['abc'],
      });
      expect(sql`id=${1} and name=${'abc'}`).toEqual({
        sql: 'id=? and name=?',
        values: [1, 'abc'],
      });
    });
    it('interpolate iterable', () => {
      expect(sql`id IN ${[1, 2, 3]}`).toEqual({
        sql: 'id IN (?,?,?)',
        values: [1, 2, 3],
      });
      expect(sql`name IN ${['foo', 'bar', 'baz']}`).toEqual({
        sql: 'name IN (?,?,?)',
        values: ['foo', 'bar', 'baz'],
      });
    });
    it('interpolate object', () => {
      expect(sql`WHERE ${{ a: 1 }}`).toEqual({
        sql: 'WHERE (??=?)',
        values: ['a', 1],
      });
      expect(sql`WHERE ${{ b: null }}`).toEqual({
        sql: 'WHERE (?? IS NULL)',
        values: ['b'],
      });
      expect(sql`WHERE ${{ c: undefined }}`).toEqual({
        sql: 'WHERE (0=1)',
        values: [],
      });
      expect(sql`WHERE ${{ a: 1, b: null, c: undefined }}`).toEqual({
        sql: 'WHERE (??=? AND ?? IS NULL)',
        values: ['a', 1, 'b'],
      });
    });
  });

  describe('isNull', () => {
    it('should work', () => {
      expect(sqlTemplate.isNull('a')).toEqual({
        sql: '(?? IS NULL)',
        values: ['a'],
      });
    });
  });

  describe('isNotNull', () => {
    it('should work', () => {
      expect(sqlTemplate.isNotNull('a')).toEqual({
        sql: '(?? IS NOT NULL)',
        values: ['a'],
      });
    });
  });

  describe('between', () => {
    it('should work', () => {
      expect(sqlTemplate.between('a', 'min', 'max')).toEqual({
        sql: '(?? BETWEEN ? AND ?)',
        values: ['a', 'min', 'max'],
      });
    });
  });

  describe('notBetween', () => {
    it('should work', () => {
      expect(sqlTemplate.notBetween('a', 'min', 'max')).toEqual({
        sql: '(?? NOT BETWEEN ? AND ?)',
        values: ['a', 'min', 'max'],
      });
    });
  });
});
