import { fromBech32, toHex } from '@cosmjs/encoding';
import { Actor, InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  ChainBase,
  ChainNetwork,
  ChainType,
  DefaultPage,
} from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { z } from 'zod';
import { models } from '../database';
import { mustBeSuperAdmin, mustExist } from '../middleware/guards';

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

type Payload = z.infer<typeof schemas.CreateCommunity.input>;

// TODO: refactor after addresses are normalized
async function findBaseAdminAddress(
  { user }: Actor,
  { base, type, user_address }: Payload,
) {
  if (user_address)
    return await models.Address.scope('withPrivateData').findOne({
      where: {
        user_id: user.id,
        address: user_address,
      },
      include: [
        {
          model: models.Community,
          where: { base },
          required: true,
        },
      ],
    });

  if (base === ChainBase.NEAR)
    throw new InvalidInput(CreateCommunityErrors.InvalidBase);

  if (base === ChainBase.Ethereum)
    return await models.Address.scope('withPrivateData').findOne({
      where: {
        user_id: user.id,
        address: {
          [Op.startsWith]: '0x',
        },
      },
      include: [
        {
          model: models.Community,
          where: { base },
          required: true,
        },
      ],
    });

  if (base === ChainBase.Solana)
    return await models.Address.scope('withPrivateData').findOne({
      where: {
        user_id: user.id,
        address: {
          // This is the regex formatting for solana addresses per their website
          [Op.regexp]: '[1-9A-HJ-NP-Za-km-z]{32,44}',
        },
      },
      include: [
        {
          model: models.Community,
          where: { base },
          required: true,
        },
      ],
    });

  // Onchain community can be created by Admin only,
  // but we allow offchain cmty to have any creator as admin:
  // if signed in with Keplr or Magic:
  if (base === ChainBase.CosmosSDK && type === ChainType.Offchain)
    return await models.Address.scope('withPrivateData').findOne({
      where: { user_id: user.id },
      include: [
        {
          model: models.Community,
          where: { base },
          required: true,
        },
      ],
    });
}

export function bech32ToHex(address: string) {
  try {
    const encodedData = fromBech32(address).data;
    return toHex(encodedData);
  } catch (e) {
    console.log(`Error converting bech32 to hex: ${e}. Hex was not generated.`);
  }
}

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

      const admin_address = await findBaseAdminAddress(actor, payload);

      mustExist(
        `User address ${payload.user_address} in ${base} community`,
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

        await models.Address.create(
          {
            user_id: actor.user.id,
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
