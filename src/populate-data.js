import { expandValues } from "./utils.js";

export default class PopluateData {
  constructor(config) {
    this.tableName = config.tableName.toLowerCase();
    this.rowsToGenerate = config.rowsToGenerate;
    this.dbClient = config.dbClient;
    this.rowsGenerated = null;
    this.populateBatchSize = config.populateBatchSize ?? 100;
    this.dataGeneratorFn = config.dataGeneratorFn;
    this.foreignKeys = null;
    this.columnNames = null;
    this.uniqueColumnNames = null;
  }

  static async initialize(config) {
    const instance = new this(config);
    instance.columnNames = await instance.getColumnNames();
    instance.foreignKeys = await instance.getForeignTableNames();
    instance.uniqueColumnNames = await instance._getUniqueContraintsQuery();
    console.log("cc", instance.uniqueColumnNames);
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
    if (this.columnNames) return this.columnNames;
    try {
      const result = await this.dbClient.query(
        `select * from get_column_names('${this.tableName}')`,
      );
      return result.rows[0].get_column_names;
    } catch (err) {
      console.log(`error while geting column names of ${this.tableName}`, err);
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
      console.log("columnNames", columnNames);
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
   * @returns {Array<number>} An array of random 'id' values from the foreign table.
   * @throws {Error} If an error occurs while querying the database or retrieving the random ids.
   */
  async getRandomIdsFromForeignTables(foreignTableName) {
    try {
      const result = await this.dbClient.query(`
        select id from ${foreignTableName} ORDER BY RANDOM()
        LIMIT ${this.populateBatchSize};
      `);
      return result[0].rows.id;
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
  async generateInsertQuery() {
    const keysToInsert = this._getInserstionKeys();
    const uniqueColumnNames = this._returnLargestCompositeKey();

    let query = `
      insert into ${this.tableName}(${keysToInsert.join(",")})
      VALUES${expandValues(keysToInsert.length, this.populateBatchSize)}
    `;

    if (uniqueColumnNames.length) {
      query += `ON CONFLICT (${uniqueColumnNames.join(",")}) do nothing`;
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
    const foreignColumns = Object.values(this.foreignKeys);
    const nonForeignCoulumns = Object.keys(this.dataGeneratorFn());
    return [...nonForeignCoulumns, ...foreignColumns];
  }

  async generateDataTasks() {
    const count = await this.getTotalRowCount();
    if (this.rowsGenerated === null) this.rowsGenerated = count;
    if (count >= this.rowsToGenerate) return [];

    const promises = [];
    const totalQueriesToRun = Math.abs(this.rowsToGenerate - count);
    const fullBatches = Math.floor(totalQueriesToRun / this.populateBatchSize);
    const remainingRows = totalQueriesToRun % this.populateBatchSize;

    for (let i = 0; i < fullBatches; i++) {
      promises.push(this.createBatchPromise());
    }

    if (remainingRows > 0) {
      promises.push(this.createBatchPromise(remainingRows));
    }

    return promises;
  }
  createBatchPromise() {
    return async () => {
      try {
        // await this.dbClient.query('BEGIN');
        const insertionQuery = await this.generateInsertQuery();
        const values = await this.getValuesCombinedWithFoerignIds();
        console.log("insertQuery", insertionQuery, values);
        await this.dbClient.query(insertionQuery, values);
        // await this.dbClient.query('COMMIT');
        this.rowsGenerated += this.populateBatchSize;
      } catch (err) {
        // await this.dbClient.query('ROLLBACK');
        console.error("Error in batch operation, transaction rolled back:", err);
        throw err;
      }
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
    if (!uniqueColumnNamesFromTableResults.length) return null;
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
  async getValuesCombinedWithFoerignIds() {
    try {
      const foreignKeyColumns = this.foreignKeys;

      const foriegnKeyValues = await Promise.all(
        Object.values(foreignKeyColumns).map((fk) => this.getRandomIdsFromForeignTables(fk)),
      );
      const values = [];
      for (let i = 0; i < this.populateBatchSize; i++) {
        if (i > foriegnKeyValues.length) break;
        values.push([
          ...Object.values(this.dataGeneratorFn()),
          ...foriegnKeyValues.map((arr) => arr[i]),
        ]);
      }
      return values;
    } catch (err) {
      throw err;
    }
  }

  async getTotalRowCount() {
    try {
      const result = await this.dbClient.query(`select count(*) from ${this.tableName}`);
      return parseInt(result.rows[0].count, 10);
    } catch (err) {
      // await this.dbClient.query('ROLLBACK');
      console.log(`couldnt fetch row count of ${this.tableName}`, err);
      throw err;
    }
  }

  allRowsHaveBeenGenerated() {
    return this.rowsGenerated >= this.rowsToGenerate;
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
