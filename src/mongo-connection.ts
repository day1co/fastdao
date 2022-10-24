import 'dotenv/config';
import mongoose, { Mongoose, Schema, SchemaOptions, ConnectOptions } from 'mongoose';

interface Primary {
  host: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  query?: {
    [key: string]: string | boolean;
  };
}
interface Secondary {
  host: string;
  port?: number;
}
export interface MongoConnectionConfig {
  primary: Primary;
  secondary?: [Secondary];
  arbiter?: [Secondary];
}

interface CustomObject {
  [x: string | symbol]: any;
}
const serialize = (obj: CustomObject): string => {
  let str = '';
  Object.keys(obj).map((key: string) => {
    let prefix = '';
    if (obj.hasOwnProperty(key)) {
      if (str.length) prefix = '&';
      str += `${prefix}${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`;
    }
  });
  return str;
};

const env = process.env.NODE_ENV;

export const mongoConnect = (config: MongoConnectionConfig): Mongoose => {
  let url = 'mongodb://localhost:27017/test';

  if (env != 'test') {
    const { primary, secondary = [] } = config;

    const auth = `${primary.user}:${primary.password}`;

    const hosts: [string] = primary.port ? [`${primary.host}:${primary.port}`] : [`${primary.host}`];
    secondary.map((item) => {
      const host = item.port ? `${item.host}:${item.port}` : `${item.host}`;
      hosts.push(host);
    });

    const queryString = primary.query ? `?${serialize(primary.query)}` : '';
    url = `mongodb+srv://${auth}@${hosts.join()}/${primary.database}${queryString}`;
  }
  mongoose.set('bufferCommands', true);
  mongoose.connect(url);
  return mongoose;
};

export type { Mongoose } from 'mongoose';
