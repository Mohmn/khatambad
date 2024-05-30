import getDBConnection from "./connection.js";
import { shuffleArray } from "./utils.js";
import {
  getCartTableQuery,
  getOrderTableQuery,
  getProductsTableQuery,
  getSellerProductTableQuery,
  getSellerTableQuery,
  getCustomerTableQuery,
} from "./createTableQueries.js";

import {
  generateCustomerData,
  generateProductData,
  generateSellerData,
  generateSellerProductData,
} from "./fake-data.js";
import {
  getColumnNamesQueryFunction,
  getForeignKeyTableNameQueryFunction,
  getUniqueColumnNamesFromTableFunction,
  isForeignKeyQueryFunction,
} from "./createHelperFunctions.js";
import PopluateData from "./populate-data.js";
import TaskQueuePC from "./task-queue-producer-consumer.js";

async function createDbTables(client) {
  try {
    await Promise.all([
      client.query(getSellerTableQuery()),
      client.query(getCustomerTableQuery()),
      client.query(getProductsTableQuery()),
      client.query(getSellerProductTableQuery()),
      client.query(getCartTableQuery()),
      // client.query(getOrderTableQuery()),
    ]);
    console.log("succesfuly created tables");
  } catch (error) {
    console.log("error while creating tables", error);
    throw error;
  }
}

async function createHelperFunctions(client) {
  try {
    await Promise.all([
      client.query(getForeignKeyTableNameQueryFunction()),
      client.query(getColumnNamesQueryFunction()),
      client.query(getUniqueColumnNamesFromTableFunction()),
      client.query(isForeignKeyQueryFunction()),
    ]);
    console.log("succesfuly created helper Functions");
  } catch (error) {
    console.log("error while creating helper functions", error);
    throw error;
  }
}

/**
 * Function: populateDataFactory
 *
 * Description: Factory function to initialize and return an instance of PopluateData class based on the provided type.
 *
 * @param {string} type - The type of data to populate (e.g., "Seller", "Customer", "Product", "SellerProduct").
 * @param {object} dbClient - The database client object to interact with the database.
 * @param {number} rowsToGenerate - The number of rows to generate for the specified type.
 * @param {number} populateBatchSize - The batch size for populating data in the database.
 * @param {function} dataGeneratorFn - The function that generates data for the specified type.
 *
 * @returns {Promise<PopluateData>} - A Promise that resolves to an instance of PopluateData class initialized with the provided configuration.
 *
 * @throws {Error} - If the provided type is not recognized or supported.
 */

async function populateDataFactory(
  type,
  dbClient,
  rowsToGenerate,
  populateBatchSize,
  dataGeneratorFn,
) {
  if (type === "Seller") {
    return await PopluateData.initialize({
      tableName: type,
      dbClient,
      rowsToGenerate,
      populateBatchSize,
      dataGeneratorFn,
    });
  }
  if (type === "Customer") {
    return await PopluateData.initialize({
      tableName: type,
      dbClient,
      rowsToGenerate,
      populateBatchSize,
      dataGeneratorFn,
    });
  }
  if (type === "Product") {
    return await PopluateData.initialize({
      tableName: type,
      dbClient,
      rowsToGenerate,
      populateBatchSize,
      dataGeneratorFn,
    });
  }
  if (type === "SellerProduct") {
    return await PopluateData.initialize({
      tableName: type,
      dbClient,
      rowsToGenerate,
      populateBatchSize,
      dataGeneratorFn,
    });
  }

  throw new Error("table doesnt exit", type);
}

// id SERIAL PRIMARY KEY,
// seller_id INTEGER REFERENCES Seller(id) ON DELETE CASCADE NOT NULL,
// product_id INTEGER REFERENCES Product(id) ON DELETE CASCADE NOT NULL,
// price NUMERIC(50, 4) NOT NULL CHECK (price >= 0),
// discount NUMERIC(5, 4) NOT NULL DEFAULT 0 CHECK (discount >= 0),
// createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
// updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
// UNIQUE (seller_id, product_id)
// insert into getSellerProductTableQuery(seller_id,product_id,price,discount)
// values(8460066,2804901,50,2)
(async function main() {
  const lakh = 222000;
  const populateBatchSize = 471;
  const connection = await getDBConnection();
  await Promise.all([createDbTables(connection), createHelperFunctions(connection)]);

  const taskConsumerQueue = new TaskQueuePC(500);
  const sellerPopulator = await populateDataFactory(
    "Seller",
    connection,
    lakh,
    populateBatchSize,
    generateSellerData,
  );
  const customerPopulator = await populateDataFactory(
    "Customer",
    connection,
    lakh,
    populateBatchSize,
    generateCustomerData,
  );
  const productPopulator = await populateDataFactory(
    "Product",
    connection,
    lakh,
    populateBatchSize,
    generateProductData,
  );

  const sellerProductPopulator = await populateDataFactory(
    "SellerProduct",
    connection,
    lakh,
    populateBatchSize,
    generateSellerProductData,
  );

  let dataHasBeenPopulated = () =>
    sellerPopulator.allRowsHaveBeenGenerated() &&
    customerPopulator.allRowsHaveBeenGenerated() &&
    productPopulator.allRowsHaveBeenGenerated();
  // &&
  // sellerProductPopulator.allRowsHaveBeenGenerated();

  let continueProcessing = true;

  while (continueProcessing) {
    continueProcessing = !dataHasBeenPopulated();
    // console.log("Main Loop Iteration:", "Queue Empty:", continueProcessing, dataHasBeenPopulated());
    if (taskConsumerQueue.hasNoTasks()) {
      const taskArray = [
        ...(await sellerPopulator.generateDataTasks()),
        ...(await customerPopulator.generateDataTasks()),
        ...(await productPopulator.generateDataTasks()),
        // ...(await sellerProductPopulator.generateDataTasks()),
      ];
      shuffleArray(taskArray).forEach((task) => {
        taskConsumerQueue.runTask(task).catch((err) => {
          console.log("Error running task:", err);
        });
      });
    }
    // i++;
    // process.nextTick(() => {console.log('give control back to the event loop')})
    // give control back to the event loop')
    // await here means wait unit its gets resolved ,
    // in the mean time do context swithing aka do other protity tasks in event loop
    // if we remove this line this will actulay blcok the ecent qeue
    await new Promise((resolve) => setImmediate(resolve));
  }

  console.log("done", continueProcessing);
})();
