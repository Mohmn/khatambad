import { expandValues } from "./utils.js";

/**
 * Represents a class for populating data into a specified table.
 *
 * @param {Object} config - The configuration object for PopluateData.
 * @param {string} config.tableName - The name of the table to populate data into.
 * @param {number} config.rowsToGenerate - The number of rows to generate for populating the table.
 * @param {Object} config.dbClient - The database client object for executing queries.
 * @param {number} [config.populateBatchSize=100] - The batch size for populating data.
 * @param {Function} config.dataGeneratorFn - The function that generates data for non-foreign key columns.
 *
 * @property {string} tableName - The name of the table to populate data into.
 * @property {number} rowsToGenerate - The number of rows to generate for populating the table.
 * @property {Object} dbClient - The database client object for executing queries.
 * @property {number} rowsGenerated - The number of rows already generated.
 * @property {number} populateBatchSize - The batch size for populating data.
 * @property {Function} dataGeneratorFn - The function that generates data for non-foreign key columns.
 * @property {Object} foreignKeys - The foreign keys and their corresponding table names.
 * @property {Array<string>} columnNames - The column names of the table.
 * @property {Array<string>} uniqueColumnNames - The unique column names of the table.
 *
 * @method initialize - Initializes the PopluateData instance with the provided configuration.
 * @method getColumnNames - Retrieves the column names of the table from the database.
 * @method getForeignTableNames - Retrieves the foreign keys and their corresponding table names for the current table.
 * @method getRandomIdsFromForeignTables - Retrieves random ids from a specified foreign table.
 * @method generateInsertQuery - Generates an insert query for populating the table with available keys.
 * @method generateDataTasks - Generates data population tasks based on batch size and remaining rows.
 * @method createBatchPromise - Creates a batch promise for populating data.
 * @method _getInserstionKeys - Retrieves the insertion keys for populating the table.
 * @method _returnLargestCompositeKey - Returns the largest composite key from the unique column names.
 * @method _getUniqueContraintsQuery - Retrieves the unique constraints for the current table from the database.
 * @method getValuesCombinedWithFoerignIds - Retrieves values combined with foreign keys for populating the table.
 * @method getTotalRowCount - Retrieves the total row count of the table.
 * @method allRowsHaveBeenGenerated - Checks if all rows have been generated for the table.
 */
export default class PopulateTable {
  constructor(config) {
    this.tableName = config.tableName.toLowerCase();
    this.rowsToGenerate = config.rowsToGenerate;
    this.dbClient = config.dbClient;
    this.rowsGenerated = 0;
    this.populateBatchSize = config.populateBatchSize ?? 100;
    this.dataGeneratorFn = config.dataGeneratorFn;
    this.foreignKeys = null;
    this.columnNames = null;
    this.uniqueColumnNames = null;
    this.runningQueries = false;
  }

  static async initialize(config) {
    const instance = new this(config);
    instance.columnNames = await instance.getColumnNames();
    instance.foreignKeys = await instance.getForeignTableNames();
    instance.uniqueColumnNames = await instance._getUniqueContraintsQuery();
    instance.rowsGenerated = await instance.getTotalRowCount();
    return instance;
  }

  /**
   * Asynchronously retrieves the column names of the table from the database.
   * If the column names are already available, returns them directly.
   *
   * @returns {Promise<Array<string>>} A promise that resolves with an array of column names.
   * @throws {Error} If an error occurs while fetching the column names.
   */
  async getColumnNames() {
    try {
      const result = await this.dbClient.query(
        `select * from get_column_names('${this.tableName}')`,
      );
      return result.rows[0].get_column_names;
    } catch (err) {
      console.log(`error while geting column names of ${this.tableName}`, err);
      throw err;
    }
  }

  /**
   * Asynchronously retrieves the foreign keys and their corresponding table names for the current table.
   * If the foreign keys are already available, returns them directly.
   *
   * @returns {Promise<Record<string,string>} A promise that resolves with an object containing foreign keys and their table names.
   * @throws {Error} If an error occurs while fetching the foreign keys.
   */
  async getForeignTableNames() {
    if (this.foreignKeys) return this.foreignKeys;
    try {
      const columnNames = await this.getColumnNames();
      const foreignKeys = {};
      await Promise.all(
        columnNames.map((element) => {
          return this.dbClient
            .query(`select * from get_foreign_key_table_name('${this.tableName}','${element}')`)
            .then((result) => {
              const tableNameToWhichForeignKeyBelongs = result.rows[0].get_foreign_key_table_name;
              if (tableNameToWhichForeignKeyBelongs) {
                foreignKeys[element] = tableNameToWhichForeignKeyBelongs;
              }
            })
            .catch((err) => {
              console.log("error while checking for foreign key ", err);
              throw err;
            });
        }),
      );
      const orderedForeignKeysAndTheirTableName = {};
      columnNames.forEach((key) => {
        if (foreignKeys[key]) orderedForeignKeysAndTheirTableName[key] = foreignKeys[key];
      });
      return orderedForeignKeysAndTheirTableName;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Asynchronously retrieves random ids from the specified foreign table.
   *
   * Executes a query to select random 'id' values from the given 'foreignTableName' in a random order.
   * Limits the result set to the 'populateBatchSize' specified for batching purposes.
   *
   * @param {string} foreignTableName - The name of the foreign table to retrieve random ids from.
   * @returns {Promise<Array<number>>} An array of random 'id' values from the foreign table.
   * @throws {Error} If an error occurs while querying the database or retrieving the random ids.
   */
  async getRandomIdsFromForeignTables(foreignTableName, rowSize) {
    try {
      const result = await this.dbClient.query(`
        select id from ${foreignTableName} ORDER BY RANDOM()
        LIMIT ${rowSize};
      `);
      return result.rows.map((r) => r.id);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generates an insert query for populating the table with available keys.
   *
   * Retrieves the keys to insert by calling the '_getInserstionKeys' method and the unique column names by calling the '_returnLargestCompositeKey' method.
   * Constructs an insert query with the table name, keys to insert, and batch size using the 'expandValues' function.
   * If there are unique column names, adds an 'ON CONFLICT' clause to the query.
   */
  generateInsertQuery(rowSize) {
    const keysToInsert = this._getInserstionKeys();
    const uniqueColumnNames = this._returnLargestCompositeKey();

    let query = `
      insert into ${this.tableName}(${keysToInsert.join(",")})
      VALUES${expandValues(keysToInsert.length, rowSize)}
    `;

    if (uniqueColumnNames.length) {
      query += `ON CONFLICT (${uniqueColumnNames.join(",")}) do nothing;`;
    }

    return query;
  }

  /**
   * Retrieves the insertion keys for populating the table.
   *
   * Combines non-foreign key columns with foreign key columns and returns the result.
   *
   * @returns {Array<string>} An array of insertion keys for populating the table.
   */
  _getInserstionKeys() {
    const foreignColumns = Object.keys(this.foreignKeys);
    const nonForeignCoulumns = Object.keys(this.dataGeneratorFn());
    return [...nonForeignCoulumns, ...foreignColumns];
  }

  async generateDataTasks() {
    // console.log("ff start", this.rowsGenerated, this.rowsToGenerate);
    if (this.allRowsHaveBeenGenerated()) return [];

    const promises = [];
    const totalQueriesToRun = Math.abs(this.rowsToGenerate - this.rowsGenerated);
    const fullBatches = Math.floor(totalQueriesToRun / this.populateBatchSize);
    const remainingRows = totalQueriesToRun % this.populateBatchSize;
    for (let i = 0; i < fullBatches; i++) {
      promises.push(this.createBatchPromise(this.populateBatchSize));
    }

    if (remainingRows > 0) promises.push(this.createBatchPromise(remainingRows));

    return promises;
  }

  createBatchPromise(rowSize) {
    return () => {
      return new Promise((res, rej) => {
        this.runningQueries = true;
        this.rowsGenerated += rowSize;

        const handleBatchOperation = async () => {
          try {
            // await this.dbClient.query('BEGIN');
            const insertionQuery = this.generateInsertQuery(rowSize);
            const values = await this.getValuesCombinedWithFoerignIds(rowSize);

            this.dbClient
              .query(insertionQuery, values)
              .then(() => {
                this.runningQueries = false;
                res();
              })
              .catch((err) => {
                this.rowsGenerated -= rowSize;
                console.log("err table create class", err);
                rej(err);
              });
            // await this.dbClient.query('COMMIT');
          } catch (err) {
            this.rowsGenerated -= rowSize;
            // await this.dbClient.query('ROLLBACK');
            console.error("Error in batch operation, transaction rolled back:", err);
            rej(err);
          }
        };

        handleBatchOperation();
      });
    };
  }

  /**
   * Returns the largest composite key from the given array of unique column names.
   *
   * If the array of unique column names is empty, returns null.
   *
   * @param {Array<string>} uniqueColumnNamesFromTableResults - An array of unique column names to find the largest composite key from.
   * @returns {string|null} The largest composite key from the array of unique column names, or null if the input array is empty.
   */
  _returnLargestCompositeKey() {
    const uniqueColumnNamesFromTableResults = [...this.uniqueColumnNames];
    if (!uniqueColumnNamesFromTableResults.length) return [];
    let maxLength = 0,
      maxLengthIndex = 0;
    for (let i = 0; i < uniqueColumnNamesFromTableResults.length; i++) {
      const uniqueColumnNames = uniqueColumnNamesFromTableResults[i];
      const uniqueColumnNamesLen = uniqueColumnNames.split(",").length;

      if (uniqueColumnNamesLen > maxLength) {
        maxLength = uniqueColumnNamesLen;
        maxLengthIndex = i;
      }
    }

    const maxLenUniqueKey = uniqueColumnNamesFromTableResults[maxLengthIndex];

    // "{selling_license_key}" inorder to stripoff [",{,}]
    return maxLenUniqueKey.substring(1, maxLenUniqueKey.length - 1).split(",");
  }

  /**
   * Asynchronously retrieves the unique constraints for the current table from the database.
   * If the unique constraints are already available, returns them directly.
   *
   * @returns {Promise<Array<string>>} A promise that resolves with an array of unique constraints.
   * @throws {Error} If an error occurs while fetching the unique constraints.
   */
  async _getUniqueContraintsQuery() {
    try {
      const result = await this.dbClient.query(`
      select * from get_unique_column_names_from_table('${this.tableName}');
    `);
      return result.rows[0].get_unique_column_names_from_table;
    } catch (err) {
      console.log(`error while geting unique column names for ${this.tableName}`, err);
      throw err;
    }
  }

  /**
   * Asynchronously retrieves values combined with foreign keys for populating the table.
   *
   * @param {Function} nonForienKeyPopulateFunc - A function that generates values for non-foreign key columns.
   * @returns {Promise<Array<Array<any>>} A promise that resolves with an array of arrays containing values combined with foreign keys.
   * @throws {Error} If an error occurs while retrieving values or combining with foreign keys.
   */
  async getValuesCombinedWithFoerignIds(rowSize) {
    try {
      const foreignKeyColumns = this.foreignKeys;
      const foreignTableNames = Object.values(foreignKeyColumns);
      const foriegnKeyValues = await Promise.all(
        foreignTableNames.map(async (fk) => {
          return await this.getRandomIdsFromForeignTables(fk, rowSize);
        }),
      );
      const values = [];
      for (let i = 0; i < rowSize; i++) {
        values.push(...Object.values(this.dataGeneratorFn()));
        if (foreignTableNames.length > 0) {
          const keys = foriegnKeyValues.map((arr) => arr.pop());
          values.push(...keys);
        }
      }
      // console.log("vvv", values);
      return values;
    } catch (err) {
      throw err;
    }
  }

  async getTotalRowCount() {
    try {
      console.log("this tablname", this.tableName);
      const result = await this.dbClient.query(`select count(*) from ${this.tableName}`);
      return parseInt(result.rows[0].count, 10);
    } catch (err) {
      // await this.dbClient.query('ROLLBACK');
      console.log(`couldnt fetch row count of ${this.tableName}`, err);
      throw err;
    }
  }

  allRowsHaveBeenGenerated() {
    return this.rowsGenerated >= this.rowsToGenerate && !this.runningQueries;
  }

  // async createTempTable(foreignKeyTableNames) {
  //   return `
  //   CREATE TEMP TABLE ${this.tableName + "foreignKeys"}(
  //     id SERIAL PRIMARY KEY,
  //     ${Object.entries(this.foreignKeysInfo)
  //       .map((keyname, tablename) => keyname + " Integer")
  //       .join(",")}

  //   )
  //   `;
  // }
}
