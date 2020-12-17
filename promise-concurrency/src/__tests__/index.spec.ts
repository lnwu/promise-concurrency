import { serial, TestInterface } from "ava";
import Sinon from "sinon";
import { defer } from "../defer";

import { PromiseConcurrencyController } from "../index";

const test = serial as TestInterface<{
  timer: Sinon.SinonFakeTimers;
}>;

test.beforeEach((t) => {
  t.context.timer = Sinon.useFakeTimers();
});

test.afterEach((t) => {
  t.context.timer.restore();
});

export const generateFixtureTask = <T>(defer: number, resolvedValue: T) => {
  return () =>
    new Promise<T>((resolve) => {
      setTimeout(() => {
        resolve(resolvedValue);
      }, defer);
    });
};

test("should be able to run all tasks", async (t) => {
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
  await t.context.timer.tickAsync(3000);

  runSpec();
  return d.promise;
});

test("tasks should take 3000ms when concurrency set to 1", async (t) => {
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
  await t.context.timer.tickAsync(3000);

  runSpec();
  return d.promise;
});

test("should run tasks by concurrency set when call run multiply times", async (t) => {
  const taskNames = ["task1", "task2", "task3", "task4"];

  const task1 = generateFixtureTask(1000, taskNames[0]);
  const task2 = generateFixtureTask(2000, taskNames[1]);
  const task3 = generateFixtureTask(2000, taskNames[2]);
  const task4 = generateFixtureTask(2000, taskNames[3]);

  const controller = new PromiseConcurrencyController<string>(2);

  controller.run(task1, task2);
  const result = controller.run(task3, task4);

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
  await t.context.timer.tickAsync(4000);

  runSpec();
  return d.promise;
});

test("should has correct active&pending account in times", async (t) => {
  const taskNames = ["task1", "task2", "task3", "task4", "task5"];

  const task1 = generateFixtureTask(1000, taskNames[0]);
  const task2 = generateFixtureTask(2000, taskNames[1]);
  const task3 = generateFixtureTask(2000, taskNames[2]);
  const task4 = generateFixtureTask(2000, taskNames[3]);
  const task5 = generateFixtureTask(1000, taskNames[3]);

  const controller = new PromiseConcurrencyController<string>(2);

  controller.run(task1, task2);
  const result = controller.run(task3, task4, task5);
  async function runSpec() {
    let index = 0;
    for await (const _ of result) {
      index++;
    }
    t.is(index, taskNames.length);
    d.resolve();
  }
  const d = defer<void>();
  t.is(controller.activeCount, 2);
  t.is(controller.pendingCount, 3);
  await t.context.timer.tickAsync(2000);
  t.is(controller.activeCount, 2);
  t.is(controller.pendingCount, 1);
  await t.context.timer.tickAsync(2000);
  t.is(controller.activeCount, 1);
  t.is(controller.pendingCount, 0);
  await t.context.timer.tickAsync(1000);
  t.is(controller.activeCount, 0);
  t.is(controller.pendingCount, 0);

  runSpec();
  return d.promise;
});
