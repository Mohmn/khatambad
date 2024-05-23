
// config
// tableName
// rowsToGenerate
// dbConnection
// keys to generate

/**
 * Class representing a PopluateData.
 * @constructor
 * @param {Object} config - The configuration object.
 * @param {string} config.tableName - The name of the table.
 * @param {number} config.rowsToGenerate - The number of rows to generate.
 * @param {Object} config.dbClient  - The database client.
 */
export default class PopluateData {

    constructor(config) {
        this.tableName = config.tableName
        this.rowsToGenerate = config.rowsToGenerate
        this.dbClient = config.dbClient
        this.rowsGenerated = null;
        this.populateBatchSize = config.populateBatchSize ?? 100;
    }

    async generateDataTasks(dataQueryFn, dataGeneratorFn) {
        const count = await this.getTotalRowCount();
        if (this.rowsGenerated === null) this.rowsGenerated = count;
        if (count >= this.rowsToGenerate) return [];

        const promises = [];
        const totalQueriesToRun = Math.abs(this.rowsToGenerate - count);
        const fullBatches = Math.floor(totalQueriesToRun / this.populateBatchSize);
        const remainingRows = totalQueriesToRun % this.populateBatchSize;

        for (let i = 0; i < fullBatches; i++) {
            promises.push(this.createBatchPromise(dataQueryFn, dataGeneratorFn));
        }

        if (remainingRows > 0) {
            promises.push(this.createBatchPromise(dataQueryFn, dataGeneratorFn, remainingRows));
        }

        return promises;

    }

    async getTotalRowCount() {
        try {
            const result = await this.dbClient.query(`select count(*) from ${this.tableName}`);
            return parseInt(result.rows[0].count, 10)
        } catch (err) {
            // await this.dbClient.query('ROLLBACK');
            console.log(`couldnt fetch row count of ${this.tableName}`, err)
            throw err;

        }
    }


    createBatchPromise(dataQueryFn, dataGeneratorFn) {
        return async () => {
            try {
                // await this.dbClient.query('BEGIN');
                const values = [];
                for (let j = 0; j < this.populateBatchSize; j++) {
                    values.push(...dataGeneratorFn());
                }
                await this.dbClient.query(dataQueryFn(this.populateBatchSize), values);
                // await this.dbClient.query('COMMIT');
                this.rowsGenerated += this.populateBatchSize;
            } catch (err) {
                // await this.dbClient.query('ROLLBACK');
                console.error('Error in batch operation, transaction rolled back:', err);
                throw err;
            }
        };
    }

    allRowsHaveBeenGenerated() {
        return this.rowsGenerated >= this.rowsToGenerate
    }


}

// class PopluateDependentTables extends PopluateData {

//     constructor(config) {
//         super(config)
//         this.foreignKeys =  {}
//     }

//     async getColumnNames() {
//         try {
//             const columnNames = await this.dbClient.query(`select * from get_column_names(${this.tableName})`)
//             return columnNames;
//         } catch (err) {
//             console.log(`error while geting column names of ${this.tableName}`, err)
//         }
//     }

//     async getForeignTableNames() {
//         try {
//             const columnNames = await this.getColumnNames();
//             const foreignKeys = {};


//             await Promise.all(
//                 columnNames.map(element => {
//                     return this.dbClient
//                         .query(`select * from is_foreign_key(${this.tableName},${element})`)
//                         .then(result => { if (result) foreignKeys.add({ [element]: result }) })
//                         .catch(err => {
//                             console.log('error while checking for foreign key ', err);
//                             throw err;
//                         })
//                 })
//             )
//             const orderedForeignKeysAndTheirTableName = {};
//             columnNames.forEach(key => {
//                 if (foreignKeys[key])
//                     orderedForeignKeysAndTheirTableName[key] = orderedForeignKeysAndTheirTableName[key]
//             });
//             return orderedForeignKeysAndTheirTableName;

//         } catch (error) {
//             throw error;
//         }
//     }

//     async getIdsFromForeignTables(foreignTableName) {

//         return `
//             select id from ${foreignTableName} limit ${this.populateBatchSize}
//         `

//     }

//     // seller_id INTEGER REFERENCES Seller(id) ON DELETE CASCADE NOT NULL,
//     // product_id INTEGER REFERENCES Product(id) ON DELETE CASCADE NOT NULL,
//     // price NUMERIC(50, 4) NOT NULL CHECK (price >= 0),
//     // discount NUMERIC(5, 4) NOT NULL DEFAULT 0 CHECK (discount >= 0),

//     // i have the column names , results in key_val

//     // populateQuery() {

//     // }

//     // insert into

//     // which attribut is a foreign key
// }