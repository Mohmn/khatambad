import 'dotenv/config';
import pg from 'pg';

let client = null;

const {
  DATABASE_HOST: dbHost,
  DATABASE_USER: dbUser,
  DATABASE_PASSWORD: dbPass,
  DATABASE_PORT: dbPort,
  DATABASE_NAME: dbName,
} = process.env;

console.log(`Database host: ${dbHost}`);
console.log(`Database user: ${dbUser}`);
console.log(`Database password: ${dbPass}`);
console.log(`Database port: ${dbPort}`);
console.log(`Database name: ${dbName}`);

// Validate environment variables
if (!dbHost || !dbUser || !dbPass || !dbPort || !dbName) {
  throw new Error('Database environment variables are not properly set.');
}


/**
 * Connects to the database and returns the database client.
 *
 * @returns {Promise<pg.Client>} The connected database client.
 * @throws {Error} If there is an error connecting to the database.
 */

const getDBConnection = async () => {
  if (client) return client;

  try {
    client = new pg.Client({
      user: dbUser,
      password: dbPass,
      host: dbHost,
      port: Number(dbPort),
      database: dbName,
    });

    await client.connect();
    console.log('Connected to the database successfully.');
    return client;
  } catch (error) {
    console.error('Error while connecting to the database:', error.message);
    throw error; // rethrow the error after logging it
  }
};

// Immediately invoke to test the connection
(async () => {
  try {
    await getDBConnection();
    console.log('Database connection established.');
  } catch (error) {
    console.error('Failed to establish database connection:', error);
  }
})();

export default getDBConnection;
