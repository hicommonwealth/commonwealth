import { EvmContractSources, models } from '@hicommonwealth/model';
import { EventPairs } from '@hicommonwealth/schemas';
import { Transaction } from 'sequelize';

export async function updateMigratedEvmEventSources(
  ethChainId: number,
  migratedData:
    | {
        events: Array<EventPairs>;
        lastBlockNum: number;
        contracts: EvmContractSources;
      }
    | { contracts: EvmContractSources },
  transaction: Transaction,
) {
  if (Object.keys(migratedData.contracts).length > 0) {
    const migratedSources = Object.keys(migratedData.contracts).reduce(
      (acc: Array<[number, string, string]>, contractAddress: string) => {
        migratedData.contracts[contractAddress].forEach((s) => {
          acc.push([ethChainId, contractAddress, s.event_signature]);
        });
        return acc;
      },
      [],
    );
    await models.sequelize.query(
      `
          UPDATE "EvmEventSources"
          SET events_migrated = true
          WHERE (eth_chain_id, contract_address, event_signature) IN (:migratedSources)
      `,
      { transaction, replacements: { migratedSources } },
    );
  }
}
