import { dispose } from '@hicommonwealth/core';
import { tester, type DB } from '@hicommonwealth/model';
import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  test,
} from 'vitest';
import { DatabaseCleaner } from '../../server/util/databaseCleaner';

chai.use(chaiHttp);
const { expect } = chai;

describe('DatabaseCleaner Tests', async () => {
  let models: DB;

  beforeAll(async () => {
    models = await tester.seedDb();
  });

  afterAll(async () => {
    await dispose()();
  });

  describe('Tests when the cleaner runs', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(function () {
      const now = new Date();
      now.setUTCHours(8);
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);

      // set clock to 8 AM UTC current year, month, and day
      clock = sinon.useFakeTimers(now);
    });

    afterEach(function () {
      clock.restore();
    });

    afterEach(() => {
      sinon.restore();
    });

    test('should not run if started before the correct hour', () => {
      const now = new Date();
      // set cleaner to run at 10 AM UTC
      console.log('input time to run', now.toString(), now.getUTCHours() + 4);
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, now.getUTCHours() + 4, true);

      expect(dbCleaner.timeoutID).to.not.be.undefined;
      clearTimeout(dbCleaner.timeoutID);
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(
        now.getTime() + 14400000,
      );
      expect(dbCleaner.completed).to.be.false;
    });

    test('should run exactly once (immediately) if started in the correct hour', () => {
      const now = new Date();
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, now.getUTCHours(), true);
      expect(dbCleaner.timeoutID).to.not.be.undefined;
      clearTimeout(dbCleaner.timeoutID);
      expect(dbCleaner.timeToRun.getUTCHours()).to.be.equal(now.getUTCHours());
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(now.getTime());
    });

    test('should not run if started after the correct hour', () => {
      const now = new Date();
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, now.getUTCHours() - 4, true);
      expect(dbCleaner.timeoutID).to.not.be.undefined;
      clearTimeout(dbCleaner.timeoutID);
      now.setUTCDate(now.getUTCDate() + 1);
      now.setUTCHours(now.getUTCHours() - 4);
      now.setUTCMinutes(0);
      now.setUTCMilliseconds(0);
      expect(dbCleaner.timeToRun.getTime()).to.be.equal(now.getTime());
      expect(dbCleaner.completed).to.be.false;
    });

    test('should not run if an hour to run is not provided', () => {
      const dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, NaN, true);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;
    });

    test('should not run if the hour provided is invalid', () => {
      let dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, 24, true);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;

      dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, 25, true);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;

      dbCleaner = new DatabaseCleaner();
      dbCleaner.initLoop(models, -1, true);
      expect(dbCleaner.timeToRun).to.be.undefined;
      expect(dbCleaner.timeoutID).to.be.undefined;
    });
  });
});
