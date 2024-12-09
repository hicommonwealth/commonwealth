import { dispose } from '@hicommonwealth/core';
import {
  EventRegistry,
  commonProtocol as cp,
} from '@hicommonwealth/evm-protocols';
import { createEventRegistryChainNodes } from '@hicommonwealth/model';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { getEventSources } from '../../../server/workers/evmChainEvents/getEventSources';
import { createContestEventSources } from '../../util/util';

describe('getEventSources', () => {
  beforeAll(async () => {
    await createEventRegistryChainNodes();
    await createContestEventSources(cp.ValidChains.SepoliaBase);
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should get Event-Registry and EvmEventSources', async () => {
    const result = await getEventSources();
    expect(Object.keys(result)).deep.equal(Object.keys(EventRegistry));
    for (const ethChainId in EventRegistry) {
      expect(result[ethChainId]).haveOwnProperty('rpc');
      expect(result[ethChainId]).to.haveOwnProperty('contracts');
      expect(
        result[ethChainId].contracts[cp.factoryContracts[ethChainId].factory],
      ).to.haveOwnProperty('abi');
      expect(
        result[ethChainId].contracts[cp.factoryContracts[ethChainId].factory],
      ).to.haveOwnProperty('sources');
    }
  });
});
