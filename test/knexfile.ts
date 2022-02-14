import sqlite3 from './sqlite3';
import mysql2 from './mysql2';

module.exports = sqlite3;
//module.exports = process.env.NODE_ENV === 'CI' ? sqlite3 : mysql2;
