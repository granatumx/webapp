import Knex from 'knex';
import config from './config';

let knex;

export default async () => {
  if (knex === undefined) {
    knex = await Knex({
      client: 'pg',
      connection: config.databaseUrl,
      pool: {
	      min: 2, 
	      max: 100, 
	      acquireTimeoutMillis: 30000, 
	      reapIntervalMillis: 1000,
      },
    });
  }
  return knex;
};
