import PopulateTable from "./populateTable.js";
import TaskQueuePC from "./task-queue-producer-consumer.js";

export default class PopulateData {
  constructor(config) {
    this.populateTables = config.populateTables; // array;
    this.orderToPopulateTablesIn = [];
    this.rowsToPopulateConcurrently = config.rowsToPopulateConcurrently ?? 250;
    this.taskConsumerQueue = null;
  }

  async initialize() {
    const graph = new Map();
    for (let i = 0; i < this.populateTables.length; i++) {
      const popTab = this.populateTables[i];
      if (!graph.has(popTab.tableName))
        graph.set(popTab.tableName, new Set(Object.values(popTab.foreignKeys)));

      // for (let j = 0; j < this.populateTables.length; j++) {
      //   const popTab2 = this.populateTables[j];
      //   if (popTab.tableName === popTab2.tableName) continue;
      //   const popTab2IsDependentOnPopTab = Object.values(popTab2.foreignKeys).includes(
      //     popTab.tableName,
      //   );
      //   if (popTab2IsDependentOnPopTab) graph.get(popTab.tableName).add(popTab2.tableName);
      // }
    }
    console.log("graphh", graph);
    const orderToPopulateTablesIn = this.topoSort(graph);

    orderToPopulateTablesIn.forEach((tableName) => {
      const table = this.populateTables.filter((table) => table.tableName === tableName)[0];
      this.orderToPopulateTablesIn.push(table);
    });
    this.taskConsumerQueue = new TaskQueuePC(this.rowsToPopulateConcurrently);
  }

  async populate() {
    const start = process.hrtime();

    for (let i = 0; i < this.orderToPopulateTablesIn.length; i++) {
      const populator = this.orderToPopulateTablesIn[i];
      // console
      while (!populator.allRowsHaveBeenGenerated()) {
        if (this.taskConsumerQueue.hasNoTasks()) {
          const tasks = await populator.generateDataTasks();
          tasks.forEach((task) => {
            this.taskConsumerQueue.runTask(task).catch((error) => {
              console.log("errrror", error);
            });
          });
        }
        await new Promise((resolve) => setImmediate(resolve));
      }
    }
    // Code to measure
    const [seconds, nanoseconds] = process.hrtime(start);
    console.log(`Execution time: ${seconds} seconds and ${nanoseconds} nanoseconds`);
    console.log("done33");
  }

  /**
   * Perform a topological sort on the given graph to determine the order in which tables should be populated.
   *
   * @param {Map} graph - The graph representing the dependencies between tables.
   * @returns {Array} - An array specifying the order in which tables should be populated.
   */
  topoSort(graph) {
    const visited = new Set();
    const orderToPopulateTablesIn = [];
    const dfs = (graph, source) => {
      visited.add(source);
      for (let table of graph.get(source)) {
        if (!visited.has(table)) dfs(graph, table);
      }
      orderToPopulateTablesIn.push(source);
    };
    const tables = Array.from(graph.keys());
    for (let i = 0; i < tables.length; i++) {
      if (!visited.has(tables[i])) dfs(graph, tables[i]);
    }

    console.log("ooo", orderToPopulateTablesIn, graph);

    return orderToPopulateTablesIn;
  }
}
