/* eslint-disable @typescript-eslint/no-unused-vars */
import { dispose } from '@hicommonwealth/core';
import { DB, tester } from '@hicommonwealth/model';
import { expect } from 'chai';
import { afterAll, beforeAll, describe, test } from 'vitest';
import { getEventSources } from '../../../server/workers/evmChainEvents/getEventSources';
import { localRpc } from '../../devnet/evm/evmChainEvents/util';
import {
  getTestAbi,
  getTestCommunityContract,
  getTestContract,
  getTestSignatures,
} from './util';

describe('getEventSources', () => {
  let models: DB;

  beforeAll(async () => {
    const res = await import('@hicommonwealth/model');
    models = res['models'];
    await tester.seedDb();
  });

  afterAll(async () => {
    await dispose()();
  });

  test("should not return sources that don't have a community contract", async () => {
    const result = await getEventSources(models);
    expect(result).to.deep.equal({});
  });

  test("should not return sources that don't have an ABI", async () => {
    await getTestCommunityContract();
    const result = await getEventSources(models);
    expect(result).to.deep.equal({});
  });

  test("should not return sources that don't have event signatures", async () => {
    const abi = await getTestAbi();
    const contract = await getTestContract();
    contract.abi_id = abi.id;
    await contract.save();

    const result = await getEventSources(models);
    expect(result).to.deep.equal({});
  });

  test('should return event sources organized by chain node', async () => {
    const signatures = await getTestSignatures();
    await getTestAbi();
    const result = await getEventSources(models);

    const chainNodeId = String(signatures[0].chain_node_id);
    const contractAddress = signatures[0].contract_address.toLowerCase();
    expect(result).to.exist.and.to.haveOwnProperty(chainNodeId);
    expect(result[chainNodeId].rpc).to.equal(localRpc);
    expect(result[chainNodeId].contracts).to.exist.and.to.haveOwnProperty(
      contractAddress,
    );
    expect(result[chainNodeId].contracts[contractAddress].abi).to.exist;
    expect(
      result[chainNodeId].contracts[contractAddress].sources,
    ).exist.and.to.have.lengthOf(2);

    const propCreatedSource = result[chainNodeId].contracts[
      contractAddress
    ].sources.find((s) => s.event_signature === signatures[0].event_signature);
    expect(propCreatedSource).to.exist.and.to.haveOwnProperty(
      'kind',
      signatures[0].kind,
    );

    const propQueuedSource = result[chainNodeId].contracts[
      contractAddress
    ].sources.find((s) => s.event_signature === signatures[1].event_signature);
    expect(propQueuedSource).to.exist.and.to.haveOwnProperty(
      'kind',
      signatures[1].kind,
    );
  });
});
