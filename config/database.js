const fs = require('fs');
const Pino = require('pino');
const config = require ('dotenv/config');

const logger = Pino({
    level: 'warn',
}, Pino.destination('database/database.log'));

const databaseConfig = {
  development: {
    username: process.env.DEV_DB_USERNAME,
    password: process.env.DEV_DB_PASSWORD,
    database: process.env.DEV_DB_NAME,
    host: process.env.DEV_DB_HOSTNAME,
    port: process.env.DEV_DB_PORT,
    dialect: 'postgres',
    logging: logger.debug.bind(logger)
  },
  test: {
    username: process.env.CI_DB_USERNAME,
    password: process.env.CI_DB_PASSWORD,
    database: process.env.CI_DB_NAME,
    host: process.env.CI_DB_HOSTNAME,
    port: process.env.ci_DB_PORT,
    dialect: 'postgres',
    logging: logger.debug.bind(logger)
  },
  production: {
    username: process.env.PROD_DB_USERNAME,
    password: process.env.PROD_DB_PASSWORD,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOSTNAME,
    port: process.env.PROD_DB_PORT,
    dialect: 'postgres',
    logging: logger.info.bind(logger)
  }
};

module.exports = databaseConfig