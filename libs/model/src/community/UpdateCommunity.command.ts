import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ChainBase } from '@hicommonwealth/shared';
import { models } from '../database';
import { authRoles } from '../middleware';
import { mustExist } from '../middleware/guards';
import { checkSnapshotObjectExists, commonProtocol } from '../services';

export const UpdateCommunityErrors = {
  SnapshotOnlyOnEthereum:
    'Snapshot data may only be added to chains with Ethereum base',
  InvalidDefaultPage: 'Default page does not exist',
  InvalidTransactionHash: 'Valid transaction hash required to verify namespace',
  SnapshotNotFound: 'Snapshot not found',
};

export function UpdateCommunity(): Command<typeof schemas.UpdateCommunity> {
  return {
    ...schemas.UpdateCommunity,
    auth: [authRoles('admin')],
    body: async ({ actor, payload }) => {
      const {
        id,
        snapshot,
        name,
        description,
        default_symbol,
        icon_url,
        active,
        type,
        stages_enabled,
        has_homepage,
        chain_node_id,
        directory_page_enabled,
        directory_page_chain_node_id,
        default_summary_view,
        default_page,
        social_links,
        hide_projects,
        custom_stages,
        namespace,
        transactionHash,
      } = payload;

      const community = await models.Community.findOne({
        where: { id },
        include: [
          {
            model: models.ChainNode,
            attributes: ['url', 'eth_chain_id', 'cosmos_chain_id'],
          },
        ],
      });
      mustExist('Community', community); // if authorized as admin, community is always found

      // Handle single string case and undefined case
      if (snapshot !== undefined) {
        const snapshots = typeof snapshot === 'string' ? [snapshot] : snapshot;

        if (snapshots.length > 0 && community.base !== ChainBase.Ethereum) {
          throw new InvalidInput(UpdateCommunityErrors.SnapshotOnlyOnEthereum);
        }

        if (snapshots.length) {
          const newSpaces = snapshots.filter(
            (s) => !community.snapshot_spaces.includes(s),
          );

          for (const space of newSpaces) {
            if (!(await checkSnapshotObjectExists('space', space))) {
              throw new InvalidInput(UpdateCommunityErrors.SnapshotNotFound);
            }
          }

          community.snapshot_spaces = [
            ...community.snapshot_spaces,
            ...newSpaces,
          ];
        } else {
          community.snapshot_spaces = [];
        }
      }
      if (default_page && !has_homepage)
        throw new InvalidInput(UpdateCommunityErrors.InvalidDefaultPage);

      if (namespace) {
        if (!transactionHash)
          throw new InvalidInput(UpdateCommunityErrors.InvalidTransactionHash);

        community.namespace = namespace;
        community.namespace_address =
          await commonProtocol.newNamespaceValidator.validateNamespace(
            namespace!,
            transactionHash,
            actor.address!,
            community,
          );
      }

      default_page && (community.default_page = default_page);
      name && (community.name = name);
      description && (community.description = description);
      default_symbol && (community.default_symbol = default_symbol);
      icon_url && (community.icon_url = icon_url);
      active !== undefined && (community.active = active);
      type && (community.type = type);
      stages_enabled !== undefined &&
        (community.stages_enabled = stages_enabled);
      has_homepage && (community.has_homepage = has_homepage);
      chain_node_id && (community.chain_node_id = chain_node_id);
      directory_page_enabled !== undefined &&
        (community.directory_page_enabled = directory_page_enabled);
      directory_page_chain_node_id !== undefined &&
        (community.directory_page_chain_node_id = directory_page_chain_node_id);
      default_summary_view !== undefined &&
        (community.default_summary_view = default_summary_view);
      social_links?.length && (community.social_links = social_links);
      hide_projects !== undefined && (community.hide_projects = hide_projects);
      custom_stages && (community.custom_stages = custom_stages);

      await community.save();
      return community.toJSON();
    },
  };
}
