import { ConcurrencyResult } from "./concurrency-result";

export type Task<T> = () => Promise<T>;

export class PromiseConcurrencyController<T> {
  activeCount = 0;
  private concurrencyConfig: number;
  private pendingTasks: Task<T>[] = [];
  private activeTasks: Task<T>[] = [];
  private result: ConcurrencyResult<T>;
  private shouldStop = false;
  private stopped = false;

  constructor(public readonly size: number) {
    this.concurrencyConfig = size;
    this.result = new ConcurrencyResult<T>();
  }

  run(...tasks: Task<T>[]): ConcurrencyResult<T> {
    this.pendingTasks.push(...tasks);

    this.applyActiveTasks();
    if (this.activeCount === 0) {
      this.runTasks();
    }

    return this.result;
  }

  async stop(): Promise<void> {
    if (this.stopped) {
      return Promise.resolve();
    } else {
      this.shouldStop = true;
    }
  }

  resume(): void {
    this.shouldStop = false;
    this.stopped = false;
    this.reRunTasks();
  }

  public get pendingCount(): number {
    return this.pendingTasks.length;
  }

  private applyActiveTasks = () => {
    while (this.activeTasks.length < this.concurrencyConfig) {
      if (this.pendingTasks.length > 0) {
        const nextTask = this.pendingTasks.shift();
        if (nextTask) {
          this.activeTasks.push(nextTask);
        }
      } else {
        break;
      }
    }
  };

  private runTasks = async () => {
    if (this.activeTasks.length > 0) {
      const activeTasksValues = this.activeTasks.map(async (task) => {
        this.activeCount++;
        try {
          const resolvedValue = await task();
          this.result.yield(resolvedValue);
        } catch (error) {
          // record error
          console.error(error);
        } finally {
          this.activeTasks.shift();
          this.activeCount--;
        }
      });

      await Promise.all(activeTasksValues);
      this.result.done();
      this.reRunTasks();
    }
  };

  private reRunTasks() {
    if (this.shouldStop) {
      this.stopped = true;
    } else {
      this.applyActiveTasks();
      this.runTasks();
    }
  }
}
