import { ConcurrencyResult } from "./concurrency-result";

export type Task<T> = () => Promise<T>;

export class PromiseConcurrencyController<T> {
  activeCount = 0;
  pendingCount = 0;
  private result: ConcurrencyResult<T>;

  constructor(public readonly size: number) {
    this.result = new ConcurrencyResult<T>();
  }

  run(...tasks: Task<T>[]): ConcurrencyResult<T> {
    tasks.forEach((task) => {
      task().then((resolvedValue) => {
        this.result.yield(resolvedValue);
      });
    });

    return this.result;
  }

  async stop(): Promise<void> {}

  resume() {}
}
