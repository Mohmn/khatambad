import { expect, describe, it, vi } from "vitest";
import PopulateData from "./populateData.js";
import TaskQueuePC from "./task-queue-producer-consumer.js";
import PopulateTable from "./populateTable.js";

vi.mock("./populateTable.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: vi.fn().mockImplementation((config) => ({
      ...new actual.default(config),
      foreignKeys: config.foreignKeys,
      allRowsHaveBeenGenerated: vi.fn().mockReturnValue(true),
    })),
  };
});

describe("PopulateData", () => {
  // Initialize correctly sets up the task queue and order of tables
  it("should correctly set up the task queue and order of tables when initialized", async () => {
    const mockConfig = {
      populateTables: [
        { tableName: "table1", foreignKeys: {} },
        { tableName: "table2", foreignKeys: { fk1: "table1" } },
      ],
      rowsToPopulateConcurrently: 100,
    };

    const populateData = new PopulateData(mockConfig);
    await populateData.initialize();

    expect(populateData.taskConsumerQueue).toBeInstanceOf(TaskQueuePC);
    expect(populateData.orderToPopulateTablesIn.length).toBe(2);
    expect(populateData.orderToPopulateTablesIn[0].tableName).toBe("table1");
    expect(populateData.orderToPopulateTablesIn[1].tableName).toBe("table2");
  });

  // Initialize with an empty populateTables array
  it("should handle initialization with an empty populateTables array", async () => {
    const mockConfig = {
      populateTables: [],
      rowsToPopulateConcurrently: 100,
    };

    const populateData = new PopulateData(mockConfig);
    await populateData.initialize();

    expect(populateData.taskConsumerQueue).toBeInstanceOf(TaskQueuePC);
    expect(populateData.orderToPopulateTablesIn.length).toBe(0);
  });

  it("should process all tables in correct order", async () => {
    // Mock data
    const mockConfig = {
      populateTables: [
        new PopulateTable({ tableName: "table1", foreignKeys: {} }),
        new PopulateTable({ tableName: "table2", foreignKeys: { fk1: "table1" } }),
      ],
      rowsToPopulateConcurrently: 100,
    };

    const populateData = new PopulateData(mockConfig);
    await populateData.initialize();
    await populateData.populate();
    expect(populateData.orderToPopulateTablesIn.length).toBe(2);
    expect(populateData.orderToPopulateTablesIn[0].tableName).toBe("table1");
    expect(populateData.orderToPopulateTablesIn[1].tableName).toBe("table2");
  });

  it("should process tables with multiple dependencies in correct order", async () => {
    const mockConfig = {
      populateTables: [
        new PopulateTable({ tableName: "table1", foreignKeys: {} }),
        new PopulateTable({ tableName: "table2", foreignKeys: { fk1: "table1" } }),
        new PopulateTable({ tableName: "table3", foreignKeys: { fk1: "table1", fk2: "table2" } }),
      ],
      rowsToPopulateConcurrently: 100,
    };

    const populateData = new PopulateData(mockConfig);
    await populateData.initialize();
    await populateData.populate();
    expect(populateData.orderToPopulateTablesIn.length).toBe(3);
    expect(populateData.orderToPopulateTablesIn[0].tableName).toBe("table1");
    expect(populateData.orderToPopulateTablesIn[1].tableName).toBe("table2");
    expect(populateData.orderToPopulateTablesIn[2].tableName).toBe("table3");
  });

  // it("should handle circular dependencies gracefully", async () => {
  //   const mockConfig = {
  //     populateTables: [
  //       new PopulateTable({ tableName: "table1", foreignKeys: { fk1: "table3" } }),
  //       new PopulateTable({ tableName: "table2", foreignKeys: { fk1: "table1" } }),
  //       new PopulateTable({ tableName: "table3", foreignKeys: { fk1: "table2" } }),
  //     ],
  //     rowsToPopulateConcurrently: 100,
  //   };

  //   const populateData = new PopulateData(mockConfig);
  //   await expect(populateData.initialize()).rejects.toThrow("Circular dependency detected");
  // });

  it("should handle tables with no dependencies", async () => {
    const mockConfig = {
      populateTables: [
        new PopulateTable({ tableName: "table1", foreignKeys: {} }),
        new PopulateTable({ tableName: "table2", foreignKeys: {} }),
      ],
      rowsToPopulateConcurrently: 100,
    };

    const populateData = new PopulateData(mockConfig);
    await populateData.initialize();
    await populateData.populate();
    expect(populateData.orderToPopulateTablesIn.length).toBe(2);
    expect(populateData.orderToPopulateTablesIn).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tableName: "table1" }),
        expect.objectContaining({ tableName: "table2" }),
      ]),
    );
  });

  it("should handle an empty list of tables", async () => {
    const mockConfig = {
      populateTables: [],
      rowsToPopulateConcurrently: 100,
    };

    const populateData = new PopulateData(mockConfig);
    await populateData.initialize();
    await populateData.populate();
    expect(populateData.orderToPopulateTablesIn.length).toBe(0);
  });

  it("should process tables with complex dependencies in correct order", async () => {
    const mockConfig = {
      populateTables: [
        new PopulateTable({ tableName: "table1", foreignKeys: {} }),
        new PopulateTable({ tableName: "table2", foreignKeys: { fk1: "table1" } }),
        new PopulateTable({ tableName: "table3", foreignKeys: { fk1: "table1" } }),
        new PopulateTable({ tableName: "table4", foreignKeys: { fk1: "table2", fk2: "table3" } }),
      ],
      rowsToPopulateConcurrently: 100,
    };

    const populateData = new PopulateData(mockConfig);
    await populateData.initialize();
    await populateData.populate();
    expect(populateData.orderToPopulateTablesIn.length).toBe(4);
    expect(populateData.orderToPopulateTablesIn[0].tableName).toBe("table1");
    expect(populateData.orderToPopulateTablesIn[1].tableName).toBe("table2");
    expect(populateData.orderToPopulateTablesIn[2].tableName).toBe("table3");
    expect(populateData.orderToPopulateTablesIn[3].tableName).toBe("table4");
  });
});
