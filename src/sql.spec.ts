import { SQL, MYSQL, PG } from './sql';

describe('sql', () => {
  describe('SQL', () => {
    it('should escape identifier for symbol', () => {
      const TEST = Symbol.for('hello');
      expect(SQL`${TEST}`).toBe('`hello`');
    });
    it('should bypass raw string for function', () => {
      const TEST = () => 'CURRENT_TIMESTAMP';
      expect(SQL`${TEST}`).toBe('CURRENT_TIMESTAMP');
    });
    it('should escape literal for string', () => {
      const TEST = 'hello';
      expect(SQL`${TEST}`).toBe('"hello"');
    });
    it('should escape literal for number', () => {
      const TEST = 123;
      expect(SQL`${TEST}`).toBe('123');
    });
    it('should escape literal for Date', () => {
      const TEST = new Date('1973-06-12T12:34:56.789Z');
      expect(SQL`${TEST}`).toBe('"1973-06-12 12:34:56"');
    });
    it('should escape literals for array', () => {
      const TEST = ['foo', 'bar', 'baz', 'qux'];
      expect(SQL`${TEST}`).toEqual('("foo","bar","baz","qux")');
    });
    it.skip('should not mixed type in a literal array', () => {
      const TEST = ['foo', 123, Symbol.for('baz'), () => 'qux'];
      expect(SQL`${TEST}`).toThrow();
    });
    it('should work with symbol, function, string, number and date', () => {
      const table = Symbol.for('table');
      const fn = () => 'CURRENT_TIMESTAMP';
      const name = 'name';
      const age = 50;
      const birth = new Date('1973-06-12T12:34:56.789Z');
      expect(SQL`SELECT * FROM ${table} WHERE fn=${fn} AND name=${name} AND age=${age} AND birth=${birth}`).toBe(
        'SELECT * FROM `table` WHERE fn=CURRENT_TIMESTAMP AND name="name" AND age=50 AND birth="1973-06-12 12:34:56"'
      );
    });
    it('should work with array for "in" operator', () => {
      const table = Symbol.for('table');
      const fn = () => 'CURRENT_TIMESTAMP';
      const name = ['foo', 'bar', 'baz', 'qux'];
      const age = [10, 20, 30];
      const birth = [new Date('1973-06-12T12:34:56.789Z'), new Date('1983-06-12T12:34:56.789Z'), fn];
      expect(SQL`SELECT * FROM ${table} WHERE name in ${name} AND age in ${age} AND birth in ${birth}`).toBe(
        'SELECT * FROM `table` WHERE name in ("foo","bar","baz","qux") AND age in (10,20,30) AND birth in ("1973-06-12 12:34:56","1983-06-12 12:34:56",CURRENT_TIMESTAMP)'
      );
    });
  });
  describe('MYSQL', () => {
    it('should work with symbol, function, string, number and date', () => {
      const table = Symbol.for('table');
      const fn = () => 'CURRENT_TIMESTAMP';
      const name = 'name';
      const age = 50;
      const birth = new Date('1973-06-12T12:34:56.789Z');
      expect(MYSQL`SELECT * FROM ${table} WHERE fn=${fn} AND name=${name} AND age=${age} AND birth=${birth}`).toEqual({
        sql: 'SELECT * FROM ?? WHERE fn=CURRENT_TIMESTAMP AND name=? AND age=? AND birth=?',
        values: ['table', name, age, birth],
      });
    });
    it('should work with array for "in" operator', () => {
      const table = Symbol.for('table');
      const name = ['foo', 'bar', 'baz', 'qux'];
      const age = [10, 20, 30];
      const birth = [new Date('1973-06-12T12:34:56.789Z'), new Date('1983-06-12T12:34:56.789Z')];
      expect(MYSQL`SELECT * FROM ${table} WHERE name in ${name} AND age in ${age} AND birth in ${birth}`).toEqual({
        sql: 'SELECT * FROM ?? WHERE name in ? AND age in ? AND birth in ?',
        values: ['table', name, age, birth],
      });
    });
  });
  describe('PG', () => {
    it('should work with symbol, function, string, number and date', () => {
      const table = Symbol.for('table');
      const fn = () => 'CURRENT_TIMESTAMP';
      const name = 'name';
      const age = 50;
      const birth = new Date('1973-06-12T12:34:56.789Z');
      expect(PG`SELECT * FROM ${table} WHERE fn=${fn} AND name=${name} AND age=${age} AND birth=${birth}`).toEqual({
        text: 'SELECT * FROM `table` WHERE fn=CURRENT_TIMESTAMP AND name=$1 AND age=$2 AND birth=$3',
        values: [name, age, birth],
      });
    });
    it('should work with array for "in" operator', () => {
      const table = Symbol.for('table');
      const name = ['foo', 'bar', 'baz', 'qux'];
      const age = [10, 20, 30];
      const birth = [new Date('1973-06-12T12:34:56.789Z'), new Date('1983-06-12T12:34:56.789Z')];
      expect(PG`SELECT * FROM ${table} WHERE name in ${name} AND age in ${age} AND birth in ${birth}`).toEqual({
        text: 'SELECT * FROM `table` WHERE name in $1 AND age in $2 AND birth in $3',
        values: [name, age, birth],
      });
    });
  });
});
