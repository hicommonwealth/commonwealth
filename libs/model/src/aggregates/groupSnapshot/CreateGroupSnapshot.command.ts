import { InvalidInput, logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { models } from '../../database';
import { authRoles, mustExist } from '../../middleware';
import { SuiNFTProvider } from '../../services/tokenBalanceCache/providers/SuiNFTProvider';

const log = logger(import.meta);

type SuiNFTSource = {
  source_type: BalanceSourceType.SuiNFT;
  sui_network: string;
  collection_id: string;
  token_standard?: string;
};

function extractSuiNFTSource(requirements: any[]): SuiNFTSource | null {
  for (const requirement of requirements) {
    if (requirement.rule === 'threshold' && requirement.data?.source) {
      const source = requirement.data.source;
      if (source.source_type === BalanceSourceType.SuiNFT) {
        return {
          source_type: source.source_type,
          sui_network: source.sui_network,
          collection_id: source.collection_id,
          token_standard: source.token_standard,
        };
      }
    }
  }
  return null;
}

export function CreateGroupSnapshot(): Command<
  typeof schemas.CreateGroupSnapshot
> {
  return {
    ...schemas.CreateGroupSnapshot,
    auth: [authRoles('admin')],
    body: async ({ payload }) => {
      const { community_id, group_id } = payload;

      log.info('Community admin creating group snapshot', {
        community_id,
        group_id,
      });

      const group = await models.Group.findOne({
        where: {
          id: group_id,
          community_id,
        },
        include: [
          {
            model: models.Membership,
            as: 'memberships',
            include: [
              {
                model: models.Address,
                as: 'address',
              },
            ],
          },
        ],
      });

      mustExist('Group', group);

      const suiNFTSource = extractSuiNFTSource(group.requirements);
      if (!suiNFTSource) {
        throw new InvalidInput(
          'Group does not have a SuiNFT source configuration in its requirements',
        );
      }

      const addresses =
        group.memberships
          ?.map((membership) => membership.address?.address)
          .filter((address): address is string => !!address) || [];

      if (addresses.length === 0) {
        throw new InvalidInput('No addresses found in group');
      }

      log.info(`Found ${addresses.length} addresses in group`, {
        group_id,
        community_id,
      });

      const balances = await SuiNFTProvider.getNFTBalances(addresses, {
        type: 'sui_nft',
        suiNetwork: suiNFTSource.sui_network,
        collectionId: suiNFTSource.collection_id,
      });

      const blockHeight = await SuiNFTProvider.getLatestBlockHeight(
        suiNFTSource.sui_network,
      );

      const snapshot = await models.sequelize.transaction(
        async (transaction) => {
          const snapshot = await models.GroupSnapshot.create(
            {
              group_id,
              block_height: blockHeight,
              snapshot_source: `sui_nft:${suiNFTSource.sui_network}:${suiNFTSource.collection_id}`,
              balance_map: balances,
              status: 'active',
              snapshot_date: new Date(),
            },
            { transaction },
          );
          await models.GroupSnapshot.update(
            { status: 'superseded' },
            {
              where: {
                group_id,
                status: 'active',
                id: { [Op.ne]: snapshot.id! },
              },
              transaction,
            },
          );
          return snapshot;
        },
      );

      log.info('Successfully captured group snapshot', {
        snapshot_id: snapshot.id,
        group_id,
        community_id,
        addressCount: addresses.length,
        totalAddressesWithBalance: Object.keys(balances).length,
        source: suiNFTSource,
      });

      return snapshot;
    },
  };
}
