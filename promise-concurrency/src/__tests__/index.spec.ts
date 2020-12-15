import ava, { TestInterface } from "ava";
import Sinon from "sinon";
import { ConcurrencyResult } from "../concurrency-result";
import { defer } from "../defer";

import { PromiseConcurrencyController } from "../index";

const test = ava as TestInterface<{
  timer: Sinon.SinonFakeTimers;
}>;

test.beforeEach((t) => {
  t.context.timer = Sinon.useFakeTimers();
});

test.afterEach((t) => {
  t.context.timer.restore();
});

const generateFixtureTask = <T>(defer: number, resolvedValue: T) => {
  return () =>
    new Promise<T>((resolve) => {
      console.log("start run", resolvedValue);
      setTimeout(() => {
        console.log("end run", resolvedValue);
        resolve(resolvedValue);
      }, defer);
    });
};

test("should be able to run tasks", async (t) => {
  const taskNames = ["task1", "task2"];

  const task1 = generateFixtureTask(1000, taskNames[0]);
  const task2 = generateFixtureTask(2000, taskNames[1]);

  const controller = new PromiseConcurrencyController<string>(1);

  const result = controller.run(task1, task2);

  async function runSpec() {
    let index = 0;
    for await (const value of result) {
      t.is(value, taskNames[index]);
      index++;
    }
    d.resolve();
  }

  const d = defer<void>();
  runSpec();

  t.context.timer.tick(2000);
  result.done();
  return d.promise;
});
