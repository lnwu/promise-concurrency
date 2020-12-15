import { ConcurrencyResult } from "./concurrency-result";

export type Task<T> = () => Promise<T>;

export class PromiseConcurrencyController<T> {
  activeCount = 0;
  pendingCount = 0;
  private concurrencyConfig: number;
  private pendingTasks: Task<T>[] = [];
  private activeTasks: Task<T>[] = [];
  private result: ConcurrencyResult<T>;

  constructor(public readonly size: number) {
    this.concurrencyConfig = size;
    this.result = new ConcurrencyResult<T>();
  }

  run(...tasks: Task<T>[]): ConcurrencyResult<T> {
    this.pendingTasks.push(...tasks);

    this.applyJobs();
    this.runTasks();

    return this.result;
  }

  async stop(): Promise<void> {}

  resume() {}

  private applyJobs = () => {
    while (this.activeTasks.length < this.concurrencyConfig) {
      if (this.pendingTasks.length > 0) {
        this.activeTasks.push(this.pendingTasks.shift()!);
      } else {
        break;
      }
    }
  };

  private runTasks = async () => {
    if (this.activeTasks.length > 0) {
      const activeTasksValues = this.activeTasks.map(async (task) => {
        const v = await task();
        this.result.yield(v);
        this.activeTasks.shift();
      });

      await Promise.race(activeTasksValues);
      this.result.done();

      this.applyJobs();
      this.runTasks();
    }
  };
}
