import sqlite3 from './sqlite3';
import mysql2 from './mysql2';

module.exports = process.env.NODE_ENV === 'sqlite' ? sqlite3 : mysql2;
