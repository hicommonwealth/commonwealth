import { dispose } from '@hicommonwealth/core';
import {
  EventRegistry,
  EvmEventSignatures,
  factoryContracts,
  ValidChains,
} from '@hicommonwealth/evm-protocols';
import { createEventRegistryChainNodes } from '@hicommonwealth/model';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { getEventSources } from '../../../server/workers/evmChainEvents/getEventSources';
import { createContestEventSources } from '../../util/util';

const singleContestAddress = '0x44aAFC7eCF5bb9053D5Ad750690339d3BF901952';
const recurringContestAddress = '0x5f0Fae9F9b6aE59C36129D6907f4DE4b6F7Ec2B2';

describe('getEventSources', () => {
  beforeAll(async () => {
    await createEventRegistryChainNodes();
    await createContestEventSources(
      ValidChains.SepoliaBase,
      singleContestAddress,
      recurringContestAddress,
    );
  });

  afterAll(async () => {
    await dispose()();
  });

  test('should get Event-Registry and EvmEventSources', async () => {
    const result = await getEventSources();
    expect(Object.keys(result)).deep.equal(Object.keys(EventRegistry));
    let flag = false;
    for (const ethChainId in EventRegistry) {
      expect(result[ethChainId]).haveOwnProperty('rpc');
      expect(result[ethChainId]).to.haveOwnProperty('contracts');
      expect(
        Array.isArray(
          result[ethChainId].contracts[factoryContracts[ethChainId].factory],
        ),
      ).to.be.true;

      if (ethChainId === String(ValidChains.SepoliaBase)) {
        expect(
          result[ethChainId].contracts[singleContestAddress],
        ).to.deep.equal([
          {
            eth_chain_id: parseInt(ethChainId),
            contract_address: singleContestAddress,
            event_signature: EvmEventSignatures.Contests.SingleContestStarted,
            meta: {
              events_migrated: true,
            },
          },
        ]);
        expect(
          result[ethChainId].contracts[recurringContestAddress],
        ).to.deep.equal([
          {
            eth_chain_id: parseInt(ethChainId),
            contract_address: recurringContestAddress,
            event_signature:
              EvmEventSignatures.Contests.RecurringContestStarted,
            meta: {
              events_migrated: true,
            },
          },
        ]);
        flag = true;
      }
    }
    expect(flag).to.be.true;
  });
});
