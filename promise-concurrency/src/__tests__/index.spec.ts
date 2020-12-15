import ava, { TestInterface } from "ava";
import Sinon from "sinon";
import { defer } from "../defer";

import { PromiseConcurrencyController } from "../index";

const test = ava;

export const generateFixtureTask = <T>(defer: number, resolvedValue: T) => {
  return () =>
    new Promise<T>((resolve) =>
      setTimeout(() => resolve(resolvedValue), defer)
    );
};

test("should be able to run all tasks", async (t) => {
  const timer = Sinon.useFakeTimers();
  const taskNames = ["task1", "task2"];

  const task1 = generateFixtureTask(1000, taskNames[0]);
  const task2 = generateFixtureTask(2000, taskNames[1]);

  const controller = new PromiseConcurrencyController<string>(2);

  const result = controller.run(task1, task2);

  async function runSpec() {
    let index = 0;
    for await (const value of result) {
      t.is(value, taskNames[index]);
      index++;
    }
    t.is(index, taskNames.length);
    d.resolve();
  }

  const d = defer<void>();
  runSpec();

  timer.tickAsync(2000);
  return d.promise;
});

test("should task 3000ms when concurrency set to 1", async (t) => {
  const timer = Sinon.useFakeTimers();
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
    t.is(index, taskNames.length);
    d.resolve();
  }

  const d = defer<void>();
  await timer.tickAsync(3000);

  runSpec();
  return d.promise;
});
