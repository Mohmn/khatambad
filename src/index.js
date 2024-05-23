

import getDBConnection from './connection.js'
import {
    getCartTableQuery,
    getOrderTableQuery,
    getProductsTableQuery,
    getSellerProductTableQuery,
    getSellerTableQuery,
    getCustomerTableQuery,
} from './createTableQueries.js'
import {
    getCustomerInsertQuery,
    getSellerInsertQuery,
    getProductInsertQuery
} from './createInsertQueries.js'
import {
    generateCustomerData,
    generateProductData,
    generateSellerData,
} from './fake-data.js'
import { 
    getColumnNamesQueryFunction,
    getForeignKeyTableNameQueryFunction,
 } from './createHelperFunctions.js'
import PopluateData from './populate-data.js'
import TaskQueuePC from './task-queue-producer-consumer.js';


async function createDbTables(client) {
    try {
        await Promise.all([
            client.query(getSellerTableQuery()),
            client.query(getCustomerTableQuery()),
            client.query(getProductsTableQuery()),
            client.query(getSellerProductTableQuery()),
            client.query(getCartTableQuery()),
            // client.query(getOrderTableQuery()),
        ])
        console.log('succesfuly created tables')
    } catch (error) {
        console.log('error while creating tables', error)
        throw error
    }
}

async function createHelperFunctions(client) {
    try {
        await Promise.all([
            client.query( getForeignKeyTableNameQueryFunction() ),
            client.query( getColumnNamesQueryFunction() )
        ])
        console.log('succesfuly created helper Functions')
    } catch (error) {
        console.log('error while creating helper functions', error)
        throw error
    }
}


function populateDataFactory(type, dbClient, rowsToGenerate, populateBatchSize) {

    if (type === 'Seller') {
        return new PopluateData({ tableName: type, dbClient, rowsToGenerate, populateBatchSize })
    }
    if (type === 'Customer') {
        return new PopluateData({ tableName: type, dbClient, rowsToGenerate, populateBatchSize })
    }
    if (type === 'Product') {
        return new PopluateData({ tableName: type, dbClient, rowsToGenerate, populateBatchSize })
    }

    throw new Error('table doesnt exit', type)
}



function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

(async function main() {
    const lakh = 200000;
    const populateBatchSize = 100;
    const connection = await getDBConnection();
    await Promise.all(
        [
            createDbTables(connection),
            createHelperFunctions(connection)
        ]
    )

    const taskConsumerQueue = new TaskQueuePC(500);
    const sellerPopulator = populateDataFactory('Seller', connection, lakh, populateBatchSize);
    const customerPopulator = populateDataFactory('Customer', connection, lakh, populateBatchSize);
    const productPopulator = populateDataFactory('Product', connection, lakh, populateBatchSize);

    let dataHasBeenPopulated = () => sellerPopulator.allRowsHaveBeenGenerated()
        && customerPopulator.allRowsHaveBeenGenerated() && productPopulator.allRowsHaveBeenGenerated();

    let continueProcessing = true;
    let i = 0;

    while (continueProcessing) {
        continueProcessing = !dataHasBeenPopulated();
        // console.log('Main Loop Iteration:', i, 'Queue Empty:', taskConsumerQueue.hasNoTasks());
        if (taskConsumerQueue.hasNoTasks()) {
            const taskArray = [
                ...(await sellerPopulator.generateDataTasks(getSellerInsertQuery, generateSellerData)),
                ...(await customerPopulator.generateDataTasks(getCustomerInsertQuery, generateCustomerData)),
                ...(await productPopulator.generateDataTasks(getProductInsertQuery, generateProductData))
            ];
            shuffleArray(taskArray).forEach(task => {
                taskConsumerQueue.runTask(task).catch(err => {
                    console.log('Error running task:', err);
                });
            });
        }
        // i++;
        // process.nextTick(() => {console.log('give control back to the event loop')})
        // give control back to the event loop')
        // await here means wait unit its gets resolved , 
        // in the mean time do context swithing aka do other protity tasks in event loop
        // if we remove this line this will actulay blcok the ecent qeue
        await new Promise(resolve => setImmediate(resolve));
    }

    // console.log('Database connection established:', connection);
})();
