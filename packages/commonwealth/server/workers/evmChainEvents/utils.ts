import { models } from '@hicommonwealth/model';
import { Transaction } from 'sequelize';
import { ContractSources, EvmEvent } from './types';

export async function updateMigratedEvmEventSources(
  ethChainId: number,
  migratedData:
    | {
        events: EvmEvent[];
        lastBlockNum: number;
        contracts: ContractSources;
      }
    | { contracts: ContractSources },
  transaction: Transaction,
) {
  if (Object.keys(migratedData.contracts).length > 0) {
    const migratedSources = Object.keys(migratedData.contracts).reduce(
      (acc: Array<[number, string, string]>, contractAddress: string) => {
        migratedData.contracts[contractAddress].sources.forEach((s) => {
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
