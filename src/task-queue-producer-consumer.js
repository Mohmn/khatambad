/**
 * TaskQueuePC class represents a task queue with concurrency control.
 *
 * The class allows tasks to be enqueued and executed by multiple consumers concurrently.
 * The number of consumers is determined by the 'concurrency' parameter passed to the constructor.
 *
 * Methods:
 * - constructor(concurrency): Initializes a new instance of the TaskQueuePC class with the specified concurrency.
 * - async consumer(): The consumer function that runs in an infinite loop, executing tasks from the task queue.
 * - getNextTask(): Retrieves the next task from the task queue.
 * - runTask(task): Enqueues a task to be executed by a consumer.
 * - hasNoTasks(): informs if the queue has no more task to consume
 *
 * Example usage:
 *
 * const taskQueue = new TaskQueuePC(3); // Create a task queue with concurrency of 3
 *
 * function myTask() {
 *   return new Promise((resolve, reject) => {
 *     // Task logic here
 *   });
 * }
 *
 * taskQueue.runTask(myTask); // Enqueue a task to be executed
 *
 *
 * @class TaskQueuePC
 */

class TaskQueuePC {
  constructor(concurrency) {
    this.taskQueue = [];
    this.consumerQueue = [];

    // spawn consumers
    for (let i = 0; i < concurrency; i++) {
      this.consumer();
    }
  }

  hasNoTasks() {
    return this.taskQueue.length === 0;
  }

  async consumer() {
    // let i = 0;
    while (true) {
      // con/sole.log('Consumer iteration:', i, 'Task Queue Length:', this.taskQueue.length, 'Consumer Queue Length:', this.consumerQueue.length);
      try {
        const task = await this.getNextTask();
        await task();
      } catch (err) {
        // console.error('Error in consumer task execution:', err);
      }
    }
  }

  getNextTask() {
    // console.log('nexttask')
    return new Promise((resolve) => {
      if (this.taskQueue.length !== 0) {
        // get task from taskQueue and resolve that
        return resolve(this.taskQueue.shift());
      }

      this.consumerQueue.push(resolve);
    });
  }

  runTask(task) {
    return new Promise((resolve, reject) => {
      const taskWrapper = () => {
        const taskPromise = task();
        // console.log('takPromose',taskPromise)
        taskPromise.then(resolve, reject);
        return taskPromise;
      };

      // console.log('inside taskq', this.consumerQueue.length,this.taskQueue.length)
      if (this.consumerQueue.length !== 0) {
        // there is a sleeping consumer available, use it to run our task
        const consumer = this.consumerQueue.shift();
        // resolve(taskWrapper)
        consumer(taskWrapper);
      } else {
        // all consumers are busy, enqueue the task
        this.taskQueue.push(taskWrapper);
      }
    });
  }
}

export default TaskQueuePC;

// Export the class if needed
// module.exports = TaskQueuePC;
