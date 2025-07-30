import { InvalidInput, logger, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { BalanceSourceType } from '@hicommonwealth/shared';
import { models } from '../../database';
import { authRoles } from '../../middleware';
import { mustExist } from '../../middleware/guards';
import { SnapshotService } from '../../services/snapshot';
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
      const { community_id, group_id, block_height } = payload;

      log.info('Community admin creating group snapshot', {
        community_id,
        group_id,
        block_height: block_height?.toString(),
      });

      let snapshotId: number | undefined;

      try {
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
          log.warn('No addresses found for group', { group_id, community_id });
          return {
            snapshot_id: 0,
            status: 'error' as const,
            message: 'No addresses found in group',
          };
        }

        log.info(`Found ${addresses.length} addresses in group`, {
          group_id,
          community_id,
        });

        const snapshot = await models.GroupSnapshot.create({
          group_id,
          block_height: block_height || null,
          snapshot_source: `sui_nft:${suiNFTSource.sui_network}:${suiNFTSource.collection_id}`,
          balance_map: {},
          status: 'pending',
          snapshot_date: new Date(),
        });

        snapshotId = snapshot.id!;
        log.info('Created pending snapshot', {
          snapshotId,
          group_id,
          community_id,
        });

        const balances = await SuiNFTProvider.getSnapshot(
          addresses,
          {
            type: 'sui_nft',
            suiNetwork: suiNFTSource.sui_network,
            collectionId: suiNFTSource.collection_id,
          },
          block_height, // Pass block_height to the provider
        );

        await snapshot.update({
          balance_map: balances,
          status: 'active',
        });

        await SnapshotService.markSnapshotsAsSuperseded(group_id, snapshotId);

        log.info('Successfully captured group snapshot', {
          snapshotId,
          group_id,
          community_id,
          addressCount: addresses.length,
          totalAddressesWithBalance: Object.keys(balances).length,
          source: suiNFTSource,
          blockHeight: block_height?.toString(),
        });

        return {
          snapshot_id: snapshotId,
          status: 'active' as const,
          message: `Successfully created snapshot for ${addresses.length} addresses with ${Object.keys(balances).length} addresses having balances`,
        };
      } catch (error) {
        log.error('Failed to capture group snapshot', error as Error, {
          group_id,
          community_id,
          snapshotId,
        });

        if (snapshotId) {
          try {
            await models.GroupSnapshot.update(
              {
                status: 'error',
                error_message: (error as Error).message,
              },
              {
                where: { id: snapshotId },
              },
            );
          } catch (updateError) {
            log.error(
              'Failed to update snapshot error status',
              updateError as Error,
              {
                snapshotId,
              },
            );
          }
        }

        return {
          snapshot_id: snapshotId || 0,
          status: 'error' as const,
          message: `Failed to create group snapshot: ${(error as Error).message}`,
        };
      }
    },
  };
}
