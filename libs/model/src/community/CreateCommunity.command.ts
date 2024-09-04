import { fromBech32, toHex } from '@cosmjs/encoding';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { Actor, InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import {
  BalanceType,
  ChainBase,
  ChainType,
  DefaultPage,
} from '@hicommonwealth/shared';
import type { Cluster } from '@solana/web3.js';
import * as solw3 from '@solana/web3.js';
import axios from 'axios';
import BN from 'bn.js';
import { Op } from 'sequelize';
import Web3 from 'web3';
import { z } from 'zod';
import { config } from '../config';
// eslint-disable-next-line import/no-cycle
import { models } from '../database';
import {
  mustBeSuperAdmin,
  mustExist,
  mustNotExist,
} from '../middleware/guards';

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
  UnegisteredCosmosChain: `Check https://cosmos.directory. Provided chain_name is not registered in the Cosmos Chain Registry`,
};

type Payload = z.infer<typeof schemas.CreateCommunity.input>;

async function checkEthereum(
  actor: Actor,
  { address, node_url, eth_chain_id, alt_wallet_url }: Payload,
) {
  // this is not part of input validation schema b/c we are using web3 utils
  if (!address || !Web3.utils.isAddress(address!))
    throw new InvalidInput(CreateCommunityErrors.InvalidAddress);

  // override provided URL for eth chains (typically ERC20) with stored, unless none found
  const node = await models.ChainNode.scope('withPrivateData').findOne({
    where: { eth_chain_id },
  });
  // if creating a new ETH node, must be a super admin -- users cannot submit custom URLs
  if (!node) mustBeSuperAdmin(actor);

  // must provide at least url to create a new node
  const _node_url = node?.private_url ?? node?.url ?? node_url;
  if (!_node_url) throw new InvalidInput(CreateCommunityErrors.MissingNodeUrl);

  const provider =
    _node_url.slice(0, 4) == 'http'
      ? new Web3.providers.HttpProvider(_node_url)
      : new Web3.providers.WebsocketProvider(_node_url);

  const web3 = new Web3(provider);
  const code = await web3.eth.getCode(address!);
  if (provider instanceof Web3.providers.WebsocketProvider)
    provider.disconnect(1000, 'finished');
  if (code === '0x')
    throw new InvalidInput(CreateCommunityErrors.InvalidAddress);

  // TODO: test altWalletUrl if available

  // Replace payload urls when node is found
  return {
    node_url: _node_url,
    private_url: node?.private_url,
    alt_wallet_url: node?.alt_wallet_url ?? alt_wallet_url,
  };
}

async function checkSolana({ address, node_url }: Payload) {
  try {
    const pubKey = new solw3.PublicKey(address!);
    const clusterUrl = solw3.clusterApiUrl(node_url as Cluster);
    const connection = new solw3.Connection(clusterUrl);
    const supply = await connection.getTokenSupply(pubKey);
    const { amount } = supply.value;
    if (new BN(amount, 10).isZero()) throw new Error('Invalid supply amount');
  } catch (e) {
    throw new InvalidInput(
      e instanceof Error ? e.message : CreateCommunityErrors.InvalidAddress,
    );
  }
}

// cosmos_chain_id is the canonical identifier for a cosmos chain.
// Our convention is to follow the "chain_name" standard established by the
// Cosmos Chain Registry:
// https://github.com/cosmos/chain-registry/blob/dbec1643b587469383635fd345634fb19075b53a/chain.schema.json#L1-L20
// This community-led registry seeks to track chain info for all Cosmos chains.
// The primary key for a chain there is "chain_name." This is our cosmos_chain_id.
// It is a lowercase alphanumeric name, like 'osmosis'.
// See: https://github.com/hicommonwealth/commonwealth/issues/4951
async function checkCosmosInput({ cosmos_chain_id, node_url }: Payload) {
  const node = await models.ChainNode.findOne({ where: { cosmos_chain_id } });
  mustNotExist('Cosmos chain node', node);

  const { data: chains } = await axios.get<string[]>(
    `${config.COSMOS.COSMOS_REGISTRY_API}/api/v1/mainnet`,
  );
  if (!chains?.find((chain) => chain === cosmos_chain_id))
    throw new InvalidInput(
      `${CreateCommunityErrors.UnegisteredCosmosChain}: ${cosmos_chain_id}`,
    );

  try {
    const tmClient = await Tendermint34Client.connect(node_url);
    await tmClient.block();
  } catch {
    throw new InvalidInput(CreateCommunityErrors.InvalidNode);
  }
}

async function validateChainInput(actor: Actor, payload: Payload) {
  if (payload.type !== ChainType.Offchain) {
    if (payload.base === ChainBase.Ethereum)
      return await checkEthereum(actor, payload);
    if (payload.base === ChainBase.Solana) await checkSolana(payload);
    else if (payload.base === ChainBase.CosmosSDK)
      await checkCosmosInput(payload);
  }
  const { node_url, alt_wallet_url } = payload;
  return { node_url, private_url: null, alt_wallet_url };
}

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
        network,
        type,
        social_links,
        website,
        discord,
        telegram,
        github,
        element,
        base,
        bech32_prefix,
        token_name,
        eth_chain_id,
        cosmos_chain_id,
      } = payload;

      // TODO: fix framework to allow the following validation as zod.refine in input schema (returning ZodEffects)
      if (base === ChainBase.Ethereum && !eth_chain_id)
        throw new InvalidInput(CreateCommunityErrors.InvalidEthereumChainId);
      if (base === ChainBase.CosmosSDK && !cosmos_chain_id)
        throw new InvalidInput(CreateCommunityErrors.CosmosChainNameRequired);

      const community = await models.Community.findOne({
        where: { [Op.or]: [{ name }, { id }, { redirect: id }] },
      });
      if (community)
        throw new InvalidInput(CreateCommunityErrors.CommunityNameExists);

      // requires super admin privilege for creating Chain/DAO
      if (type === ChainType.Chain || type === ChainType.DAO)
        mustBeSuperAdmin(actor);

      // validates inputs by chain, and returns validated urls
      const { node_url, private_url, alt_wallet_url } =
        await validateChainInput(actor, payload);

      const uniqueLinksArray = [
        ...new Set(
          [...social_links, website, telegram, discord, element, github].filter(
            (a) => a,
          ),
        ),
      ];

      const baseCommunity = await models.Community.findOne({ where: { base } });
      mustExist('Chain Base', baseCommunity);

      const admin_address = await findBaseAdminAddress(actor, payload);
      if (
        !mustExist(
          `User address ${payload.user_address} in ${base} community`,
          admin_address,
        )
      )
        return;

      // == command transaction boundary ==
      await models.sequelize.transaction(async (transaction) => {
        const [node] = await models.ChainNode.scope(
          'withPrivateData',
        ).findOrCreate({
          where: { url: node_url },
          defaults: {
            url: node_url,
            eth_chain_id,
            cosmos_chain_id,
            alt_wallet_url,
            private_url,
            balance_type:
              base === ChainBase.CosmosSDK
                ? BalanceType.Cosmos
                : base === ChainBase.Substrate
                  ? BalanceType.Substrate
                  : base === ChainBase.Solana
                    ? BalanceType.Solana
                    : BalanceType.Ethereum,
            // use first chain name as node name
            name,
          },
          transaction,
        });

        await models.Community.create(
          {
            id,
            name,
            default_symbol,
            icon_url,
            description,
            network,
            type,
            social_links: uniqueLinksArray,
            base,
            bech32_prefix,
            active: true,
            chain_node_id: node.id,
            token_name,
            has_chain_events_listener:
              network === 'aave' || network === 'compound',
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
            featured_in_sidebar: true,
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
