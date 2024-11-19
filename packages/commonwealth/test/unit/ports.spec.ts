import { Disposable, disposeAdapter, port } from '@hicommonwealth/core';
import chai from 'chai';
import chaiHttp from 'chai-http';
import { afterEach, describe, expect, test } from 'vitest';

chai.use(chaiHttp);

interface TestAdapter extends Disposable {
  fakeMethod(): string;
}

const InMemoryAdapterName = 'Test-Adapter-Name';
const testPort = port(function testPortFactory(testAdapter?: TestAdapter) {
  return (
    testAdapter || {
      name: InMemoryAdapterName,
      dispose: () => Promise.resolve(),
      fakeMethod: () => 'fake',
    }
  );
});

const s3TestAdapterName = 'S3';
const s3TestAdapter = {
  name: s3TestAdapterName,
  dispose: () => Promise.resolve(),
  fakeMethod: () => 'fake',
};

const r2TestAdapterName = 'R2';
const r2TestAdapter = {
  name: r2TestAdapterName,
  dispose: () => Promise.resolve(),
  fakeMethod: () => 'fake',
};

describe('Ports Tests', () => {
  afterEach(() => {
    disposeAdapter(s3TestAdapterName);
  });

  test('should use in-memory adapters by default', () => {
    const testAdapter = testPort();
    expect(testAdapter.name).to.equal(InMemoryAdapterName);
  });

  test('should use provided adapter by default without key', () => {
    testPort({
      adapter: s3TestAdapter,
    });
    testPort({
      key: `testPortFactory.${r2TestAdapterName}.Main`,
      adapter: r2TestAdapter,
      isDefault: false,
    });
    const testAdapter = testPort();
    expect(testAdapter.name).to.equal(s3TestAdapterName);
  });

  test('should use adapter indicated by key instead of default', () => {
    testPort({
      adapter: s3TestAdapter,
    });
    const key: `${string}.${string}.${string}` = `testPortFactory.${r2TestAdapterName}.Main`;
    testPort({
      key,
      adapter: r2TestAdapter,
      isDefault: false,
    });
    const testAdapter = testPort({ key });
    expect(testAdapter.name).to.equal(r2TestAdapterName);
  });

  test('should use default adapter with key', () => {
    testPort({
      key: `testPortFactory.${r2TestAdapterName}.Main`,
      adapter: r2TestAdapter,
      isDefault: true,
    });
    const testAdapter = testPort();
    expect(testAdapter.name).to.equal(r2TestAdapterName);
    const testAdapter2 = testPort({
      key: `testPortFactory.${r2TestAdapterName}.Main`,
    });
    expect(testAdapter2.name).to.equal(r2TestAdapterName);
  });

  test('should prevent overriding default with new default', () => {
    testPort({
      adapter: s3TestAdapter,
    });

    try {
      testPort({
        key: `testPortFactory.${r2TestAdapterName}.Main`,
        adapter: r2TestAdapter,
        isDefault: true,
      });
      expect.fail();
    } catch (e) {
      expect(e.message).to.equal(
        `Default adapter for testPortFactory port already exists`,
      );
    }
  });
});
