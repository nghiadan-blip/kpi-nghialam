import type { Knex } from 'knex';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
const dbPath = process.env.DB_PATH || path.resolve(process.cwd(), 'database', 'cbcc.sqlite');

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: dbPath
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: any, cb: any) => {
        conn.run('PRAGMA foreign_keys = ON;', cb);
      }
    },
    migrations: {
      directory: path.join(__dirname, 'database', 'migrations'),
      extension: 'ts'
    },
    seeds: {
      directory: path.join(__dirname, 'database', 'seeds'),
      extension: 'ts'
    }
  },
  production: {
    client: 'sqlite3',
    connection: {
      filename: dbPath
    },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: any, cb: any) => {
        conn.run('PRAGMA foreign_keys = ON;', cb);
      }
    },
    migrations: {
      directory: path.join(__dirname, 'database', 'migrations'),
      extension: 'js'
    },
    seeds: {
      directory: path.join(__dirname, 'database', 'seeds'),
      extension: 'js'
    }
  }
};

export default config;
