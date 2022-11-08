const {
  TEST_MYSQL_HOST = '127.0.0.1',
  TEST_MYSQL_PORT = 3306,
  TEST_MYSQL_DATABASE = 'test',
  TEST_MYSQL_USER = 'root',
  TEST_MYSQL_PASSWORD = 'root',
} = process.env;

export default {
  client: 'mysql2',
  connection: {
    host: TEST_MYSQL_HOST,
    port: TEST_MYSQL_PORT,
    database: TEST_MYSQL_DATABASE,
    user: TEST_MYSQL_USER,
    password: TEST_MYSQL_PASSWORD,
    charset: 'utf8mb4',
    timezone: 'Z',
    decimalNumbers: true,
  },
};
