// Generated by CodiumAI
import { expect, describe, it, vi } from "vitest";
import PopulateTable from "./populateTable";
describe("PopulateTable", () => {
  // correctly initializes with valid config
  it("should correctly initialize with valid config", async () => {
    const mockDbClient = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            get_column_names: ["column1", "column2"],
            get_foreign_key_table_name: null,
            get_unique_column_names_from_table: [],
          },
        ],
      }),
    };
    const config = {
      tableName: "example_table",
      rowsToGenerate: 1000,
      dbClient: mockDbClient,
      populateBatchSize: 50,
      dataGeneratorFn: () => ({
        column1: "data1",
        column2: "data2",
      }),
    };

    const populateTable = await PopulateTable.initialize(config);

    expect(populateTable.tableName).toBe("example_table");
    expect(populateTable.rowsToGenerate).toBe(1000);
    expect(populateTable.dbClient).toBe(mockDbClient);
    expect(populateTable.populateBatchSize).toBe(50);
    expect(populateTable.dataGeneratorFn()).toEqual({ column1: "data1", column2: "data2" });
    expect(populateTable.columnNames).toEqual(["column1", "column2"]);
    expect(populateTable.foreignKeys).toEqual({});
    expect(populateTable.uniqueColumnNames).toEqual([]);
  });

  // handles initialization with missing or incomplete config
  it("should handle initialization with missing or incomplete config", async () => {
    const mockDbClient = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            get_column_names: ["column1", "column2"],
            get_foreign_key_table_name: null,
            get_unique_column_names_from_table: [],
          },
        ],
      }),
    };
    const config = {
      tableName: "example_table",
      dbClient: mockDbClient,
      dataGeneratorFn: () => ({
        column1: "data1",
        column2: "data2",
      }),
    };

    const populateTable = await PopulateTable.initialize(config);

    expect(populateTable.tableName).toBe("example_table");
    expect(populateTable.rowsToGenerate).toBeUndefined();
    expect(populateTable.dbClient).toBe(mockDbClient);
    expect(populateTable.populateBatchSize).toBe(100); // Default value
    expect(populateTable.dataGeneratorFn()).toEqual({ column1: "data1", column2: "data2" });
    expect(populateTable.columnNames).toEqual(["column1", "column2"]);
    expect(populateTable.foreignKeys).toEqual({});
    expect(populateTable.uniqueColumnNames).toEqual([]);
  });

  // retrieves column names from the database
  it("should retrieve column names from the database", async () => {
    const mockDbClient = {
      query: vi.fn().mockResolvedValue({ rows: [{ get_column_names: ["column1", "column2"] }] }),
    };
    const config = {
      tableName: "example_table",
      dbClient: mockDbClient,
    };

    const populateTable = await PopulateTable.initialize(config);

    expect(populateTable.columnNames).toEqual(["column1", "column2"]);
  });

  // retrieves foreign table names based on column names
  it("should retrieve foreign table names based on column names", async () => {
    const mockDbClient = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            get_foreign_key_table_name: "foreign_table",
            get_column_names: ["column1"],
          },
        ],
      }),
    };
    const config = {
      tableName: "example_table",
      dbClient: mockDbClient,
    };

    const populateTable = await PopulateTable.initialize(config);

    expect(populateTable.foreignKeys).toStrictEqual({ column1: "foreign_table" });
  });

  // generates correct insert query with given row size
  it("should generate correct insert query with given row size", async () => {
    const config = {
      tableName: "example_table",
      dbClient: {
        query: vi.fn().mockResolvedValue({
          rows: [
            {
              get_column_names: ["column1", "column2"],
              get_unique_column_names_from_table: [],
            },
          ],
        }),
      },
      dataGeneratorFn: () => ({
        column1: "data1",
        column2: "data2",
      }),
      foreignKeys: {},
      uniqueColumnNames: [],
    };
    // const populateTable = new PopulateTable(config);
    const populateTable = await PopulateTable.initialize(config);
    const rowSize = 10;

    const insertQuery = populateTable.generateInsertQuery(rowSize);
    console.log("insertQQ", insertQuery);
    expect(insertQuery).toContain("insert into example_table(column1,column2)");
    expect(insertQuery).toContain("VALUES($1,$2),($3,$4),($5,$6),($7,$8),($9,$10)");
  });

  // generates data tasks based on rows to generate
  it("should generate data tasks based on rows to generate", async () => {
    // Mock data
    const mockDbClient = {
      query: vi.fn(),
    };
    const config = {
      tableName: "example_table",
      rowsToGenerate: 1000,
      dbClient: mockDbClient,
      populateBatchSize: 50,
      dataGeneratorFn: () => ({
        column1: "data1",
        column2: "data2",
      }),
    };

    const populateTable = new PopulateTable(config);
    const dataTasks = await populateTable.generateDataTasks();

    expect(dataTasks.length).toBeGreaterThan(0);
  });

  // retrieves random IDs from foreign tables
  it("should retrieve random IDs from foreign tables", async () => {
    // Mock data
    const mockDbClient = {
      query: vi.fn().mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }, { id: 3 }] }),
    };
    const config = {
      tableName: "example_table",
      dbClient: mockDbClient,
    };

    const populateTable = new PopulateTable(config);
    const foreignTableName = "foreign_table";
    const rowSize = 3;
    const randomIds = await populateTable.getRandomIdsFromForeignTables(foreignTableName, rowSize);

    expect(randomIds).toEqual([1, 2, 3]);
  });
});