import moment from 'moment';
import { connect } from './connection';
import * as knexOpts from '../test/knexfile';

const TEST_TABLE = 'test_tz';
const momentToDate = (x) => moment(x).toDate();
const momentFormat = (x) => moment(x).format('YYYY-MM-DD HH:mm:ss');
const momentUtcToDate = (x) => moment(x).utc().toDate();
const momentUtcFormat = (x) => moment(x).utc().format('YYYY-MM-DD HH:mm:ss');

const fixtures = [
  // epoch
  // { a: 'number(19700101)', b: 19700101 },
  // { a: 'number(19700101000000)', b: 19700101000000 },
  // { a: 'string(19700101)', b: '19700101' },
  // { a: 'string(1970-01-01)', b: '1970-01-01' },
  // { a: 'string(1970-01-01 00:00:00)', b: '1970-01-01 00:00:00' },
  // { a: 'Date(0)', b: new Date(0) },
  // { a: 'moment(0).toDate', b: momentToDate(0) },
  // { a: 'moment(0).format', b: momentFormat(0) },
  // { a: 'moment(0).utc.toDate', b: momentUtcToDate(0) },
  // { a: 'moment(0).utc.format', b: momentUtcFormat(0) },
  // now
  // { a: 'Date()', b: new Date() },
  // { a: 'moment().toDate', b: momentToDate() },
  // { a: 'moment().format', b: momentFormat() },
  // { a: 'moment().utc.toDate', b: momentUtcToDate() },
  // { a: 'moment().utc.format', b: momentUtcFormat() },
  // { a: 'Date.now()', b: Date.now() }, // error
  // { a: 'moment()', b: moment() }, // error
  // zulu
  // { a: 'new Date(2019-01-01T00:00:00Z)', b: new Date('2019-01-01T00:00:00Z') },
  // { a: 'moment(2019-01-01T00:00:00Z).toDate', b: momentToDate('2019-01-01T00:00:00Z') },
  // { a: 'moment(2019-01-01T00:00:00Z).format', b: momentFormat('2019-01-01T00:00:00Z') },
  // { a: 'moment(2019-01-01T00:00:00Z).utc.toDate', b: momentUtcToDate('2019-01-01T00:00:00Z') },
  // { a: 'moment(2019-01-01T00:00:00Z).utc.format', b: momentUtcFormat('2019-01-01T00:00:00Z') },
  { a: 'number(20190101)', b: 20190101 },
  { a: 'number(20190101000000)', b: 20190101000000 },
  { a: 'string(20190101)', b: '20190101' },
  { a: 'string(20190101000000)', b: '20190101000000' },
  { a: 'string(2019-01-01)', b: '2019-01-01' },
  { a: 'string(2019-01-01 00:00:00)', b: '2019-01-01 00:00:00' },
  { a: 'Date(2019-01-01)', b: new Date('2019-01-01') },
  { a: 'Date(2019-01-01 00:00:00)', b: new Date('2019-01-01 00:00:00') },
  { a: 'moment(2019-01-01).toDate', b: momentToDate('2019-01-01') },
  { a: 'moment(2019-01-01 00:00:00).toDate', b: momentToDate('2019-01-01 00:00:00') },
  { a: 'moment(2019-01-01).format', b: momentFormat('2019-01-01') },
  { a: 'moment(2019-01-01 00:00:00).format', b: momentFormat('2019-01-01 00:00:00') },
  { a: 'moment(2019-01-01).utc.toDate', b: momentUtcToDate('2019-01-01') },
  { a: 'moment(2019-01-01 00:00:00).utc.toDate', b: momentUtcToDate('2019-01-01 00:00:00') },
  { a: 'moment(2019-01-01).utc.format', b: momentUtcFormat('2019-01-01') },
  { a: 'moment(2019-01-01 00:00:00).utc.format', b: momentUtcFormat('2019-01-01 00:00:00') },
  { a: 'new Date(2019-01-01T00:00:00+09)', b: new Date('2019-01-01T00:00:00+09:00') },
  { a: 'moment(2019-01-01T00:00:00+09).toDate', b: momentToDate('2019-01-01T00:00:00+09:00') },
  { a: 'moment(2019-01-01T00:00:00+09).format', b: momentFormat('2019-01-01T00:00:00+09:00') },
  { a: 'moment(2019-01-01T00:00:00+09).utc.toDate', b: momentUtcToDate('2019-01-01T00:00:00+09:00') },
  { a: 'moment(2019-01-01T00:00:00+09).utc.format', b: momentUtcFormat('2019-01-01T00:00:00+09:00') },
];

describe('connection', () => {
  describe('connect', () => {
    it('should connect', () => {
      const knex = connect(knexOpts);
      expect(knex).toBeDefined();
    });
  });
});

describe('knex timezone', () => {
  const knex = connect(knexOpts);
  beforeAll(async () => {
    await knex.schema.createTable(TEST_TABLE, (t) => {
      t.string('a');
      t.dateTime('b');
    });
    await knex(TEST_TABLE).truncate();
    await knex(TEST_TABLE).insert(fixtures);
    const sql = knex(TEST_TABLE).insert(fixtures).toString();
    console.log('```');
    console.log(sql.replace(/values \(/g, 'values \n(').replace(/\), \(/g, '),\n('));
    console.log('```');
  });

  afterAll(async () => {
    await knex.schema.dropTable(TEST_TABLE);
    knex.destroy();
  });

  test('all', async () => {
    const r1 = await knex(TEST_TABLE).select();
    console.log('\n\n#### all\n');
    console.log('```');
    r1.forEach((r) => console.log(r.a, '--->', r.b));
    console.log('```');
  });

  fixtures.forEach((fixture) => {
    test(`${fixture.a}`, async () => {
      const r1 = await knex(TEST_TABLE).where('b', '<>', fixture.b).select();
      const sql = await knex(TEST_TABLE).where('b', '<>', fixture.b).toString();
      console.log(`\n\n#### ${fixture.a} <> ${fixture.b}\n`);
      console.log('* sql=', sql);
      console.log('* count=', r1.length);
      console.log('```');
      r1.forEach((r) => console.log(r.a, '--->', r.b));
      console.log('```');
    });
  });
});
