import { dispose } from '@hicommonwealth/core';
import {
  ChildContractNames,
  EventRegistry,
  EvmEventSignatures,
  commonProtocol,
  commonProtocol as cp,
} from '@hicommonwealth/evm-protocols';
import { createEventRegistryChainNodes } from '@hicommonwealth/model';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { getEventSources } from '../../../server/workers/evmChainEvents/getEventSources';
import { createContestEventSources } from '../../util/util';

const singleContestAddress = '0x123';
const recurringContestAddress = '0x321';

describe('getEventSources', () => {
  beforeAll(async () => {
    await createEventRegistryChainNodes();
    await createContestEventSources(
      cp.ValidChains.SepoliaBase,
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
          result[ethChainId].contracts[cp.factoryContracts[ethChainId].factory],
        ),
      ).to.be.true;

      if (ethChainId === String(cp.ValidChains.SepoliaBase)) {
        expect(
          result[ethChainId].contracts[singleContestAddress],
        ).to.deep.equal([
          {
            eth_chain_id: parseInt(ethChainId),
            contract_address: singleContestAddress,
            event_signature: EvmEventSignatures.Contests.SingleContestStarted,
            contract_name: ChildContractNames.SingleContest,
            parent_contract_address:
              commonProtocol.factoryContracts[
                commonProtocol.ValidChains.SepoliaBase
              ].factory,
            events_migrated: true,
            created_at_block: 1,
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
            contract_name: ChildContractNames.RecurringContest,
            parent_contract_address:
              commonProtocol.factoryContracts[
                commonProtocol.ValidChains.SepoliaBase
              ].factory,
            events_migrated: true,
            created_at_block: 1,
          },
        ]);
        flag = true;
      }
    }
    expect(flag).to.be.true;
  });
});
