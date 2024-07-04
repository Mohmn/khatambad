import getDBConnection from "./connection.js";
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
  generateCartData,
  generateOrderData,
} from "./fake-data.js";
import {
  getColumnNamesQueryFunction,
  getForeignKeyTableNameQueryFunction,
  getUniqueColumnNamesFromTableFunction,
  isForeignKeyQueryFunction,
} from "./createHelperFunctions.js";
import PopluateTable from "./populateTable.js";
import PopulateData from "./populateData.js";

async function createDbTables(client) {
  try {
    await Promise.all([
      client.query(getSellerTableQuery()),
      client.query(getCustomerTableQuery()),
      client.query(getProductsTableQuery()),
      client.query(getSellerProductTableQuery()),
      client.query(getCartTableQuery()),
      client.query(getOrderTableQuery()),
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
  if (!["Seller", "Customer", "Product", "SellerProduct", "Cart", "Orders"].includes(type))
    throw new Error("table doesnt exit", type);
  return await PopluateTable.initialize({
    tableName: type,
    dbClient,
    rowsToGenerate,
    populateBatchSize,
    dataGeneratorFn,
  });
}

(async function main() {
  const lakh = 100000;
  const populateBatchSize = 500;
  const connection = await getDBConnection();
  await Promise.all([createDbTables(connection), createHelperFunctions(connection)]);

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

  const Cart = await populateDataFactory(
    "Cart",
    connection,
    lakh,
    populateBatchSize,
    generateCartData,
  );

  const Orders = await populateDataFactory(
    "Orders",
    connection,
    lakh,
    populateBatchSize,
    generateOrderData,
  );

  const populateData = new PopulateData({
    populateTables: [
      sellerProductPopulator,
      sellerPopulator,
      Orders,
      Cart,
      productPopulator,
      customerPopulator,
    ],
    rowsToPopulateConcurrently: 400,
  });

  await populateData.initialize();
  await populateData.populate();
})();
