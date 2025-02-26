import { InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  ChainBase,
  ChainNetwork,
  ChainType,
  DefaultPage,
  bech32ToHex,
} from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { models } from '../database';
import { mustBeSuperAdmin, mustExist } from '../middleware/guards';
import { emitEvent } from '../utils';
import { findCompatibleAddress } from '../utils/findBaseAddress';

export const CreateCommunityErrors = {
  CommunityNameExists:
    'The name for this community already exists, please choose another name',
  InvalidEthereumChainId: 'Ethereum chain ID not provided or unsupported',
  CosmosChainNameRequired:
    'cosmos_chain_id is a required field. It should be the chain name as registered in the Cosmos Chain Registry.',
  InvalidAddress: 'Address is invalid',
  InvalidBase: 'Must provide valid chain base',
  MissingNodeUrl: 'Missing node url',
  InvalidNode: 'RPC url returned invalid response. Check your node url',
  // eslint-disable-next-line max-len
  UnegisteredCosmosChain: `Check https://cosmos.directory. Provided chain_name is not registered in the Cosmos Chain Registry`,
};

function baseToNetwork(n: ChainBase): ChainNetwork {
  switch (n) {
    case ChainBase.CosmosSDK:
      return ChainNetwork.Osmosis;
    case ChainBase.Substrate:
      return ChainNetwork.Edgeware;
    case ChainBase.Ethereum:
      return ChainNetwork.Ethereum;
    case ChainBase.NEAR:
      return ChainNetwork.NEAR;
    case ChainBase.Solana:
      return ChainNetwork.Solana;
  }
}

export function CreateCommunity(): Command<typeof schemas.CreateCommunity> {
  return {
    ...schemas.CreateCommunity,
    auth: [],
    body: async ({ actor, payload }) => {
      const {
        id,
        name,
        default_symbol,
        icon_url,
        description,
        type,
        social_links,
        website,
        discord,
        telegram,
        github,
        element,
        base,
        token_name,
        chain_node_id,
      } = payload;
      const community = await models.Community.findOne({
        where: { [Op.or]: [{ name }, { id }, { redirect: id }] },
      });
      if (community)
        throw new InvalidInput(CreateCommunityErrors.CommunityNameExists);

      // requires super admin privilege for creating Chain/DAO
      if (type === ChainType.Chain || type === ChainType.DAO)
        mustBeSuperAdmin(actor);

      const uniqueLinksArray = [
        ...new Set(
          [...social_links, website, telegram, discord, element, github].filter(
            (a): a is string => typeof a === 'string' && a.length > 0,
          ),
        ),
      ];

      const baseCommunity = await models.Community.findOne({ where: { base } });
      mustExist('Chain Base', baseCommunity);

      const admin_address = await findCompatibleAddress(
        actor.user.id!,
        actor.address!,
        base,
        type,
      );
      mustExist(
        `User address ${actor.address} in ${base} community`,
        admin_address,
      );

      const node = await models.ChainNode.findOne({
        where: { id: chain_node_id },
      });
      mustExist(`Chain Node`, node);

      if (base === ChainBase.Ethereum && !node.eth_chain_id)
        throw new InvalidInput(CreateCommunityErrors.InvalidEthereumChainId);
      else if (base === ChainBase.CosmosSDK && !node.cosmos_chain_id)
        throw new InvalidInput(CreateCommunityErrors.CosmosChainNameRequired);

      const user = await models.User.findOne({
        where: { id: actor.user.id },
        attributes: ['id', 'referred_by_address'],
      });
      mustExist('User', user);

      // == command transaction boundary ==
      await models.sequelize.transaction(async (transaction) => {
        await models.Community.create(
          {
            id,
            name,
            default_symbol,
            icon_url,
            description,
            network: baseToNetwork(base),
            type,
            social_links: uniqueLinksArray,
            base,
            bech32_prefix: node.bech32,
            active: true,
            chain_node_id: node.id,
            token_name,
            default_page: DefaultPage.Discussions,
            has_homepage: 'true',
            collapsed_on_homepage: false,
            custom_stages: [],
            directory_page_enabled: false,
            snapshot_spaces: [],
            stages_enabled: true,
          },
          { transaction },
        );

        await models.Topic.create(
          {
            community_id: id,
            name: 'General',
            description: 'General discussions',
            featured_in_sidebar: true,
            featured_in_new_post: false,
            group_ids: [],
          },
          { transaction },
        );

        const created = await models.Address.create(
          {
            user_id: user.id,
            address: admin_address.address,
            community_id: id,
            hex:
              base === ChainBase.CosmosSDK
                ? bech32ToHex(admin_address.address)
                : undefined,
            verification_token: admin_address.verification_token,
            verification_token_expires:
              admin_address.verification_token_expires,
            verified: admin_address.verified,
            wallet_id: admin_address.wallet_id,
            is_user_default: true,
            role: 'admin',
            last_active: new Date(),
            ghost_address: false,
            is_banned: false,
          },
          { transaction },
        );

        await emitEvent(
          models.Outbox,
          [
            {
              event_name: 'CommunityCreated',
              event_payload: {
                community_id: id,
                user_id: user.id!,
                referrer_address: user.referred_by_address ?? undefined,
                created_at: created.created_at!,
              },
            },
          ],
          transaction,
        );
      });
      // == end of command transaction boundary ==

      const new_community = await models.Community.findOne({
        where: { id },
        include: [{ model: models.ChainNode }],
      });
      return {
        community: new_community!.toJSON(),
        admin_address: admin_address.address,
      };
    },
  };
}
