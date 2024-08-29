import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { Actor, InvalidInput, type Command } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { ChainBase, ChainType } from '@hicommonwealth/shared';
import type { Cluster } from '@solana/web3.js';
import * as solw3 from '@solana/web3.js';
import axios from 'axios';
import BN from 'bn.js';
import { Op } from 'sequelize';
import Web3 from 'web3';
import { z } from 'zod';
import { config } from '../config';
import { models } from '../database';
import {
  mustBeSuperAdmin,
  mustExist,
  mustNotExist,
} from '../middleware/guards';

// import { AppError } from '@hicommonwealth/core';
// import type {
//   AddressInstance,
//   ChainNodeAttributes,
//   CommunityAttributes,
//   RoleAttributes,
// } from '@hicommonwealth/model';
// import { UserInstance } from '@hicommonwealth/model';
// import { CreateCommunity } from '@hicommonwealth/schemas';
// import {
//   BalanceType,
//   ChainBase,
//   ChainType,
//   DefaultPage,
// } from '@hicommonwealth/shared';
// import { Op } from 'sequelize';
// import { z } from 'zod';
// import { bech32ToHex, urlHasValidHTTPPrefix } from '../../../shared/utils';
// import { ServerCommunitiesController } from '../server_communities_controller';

// export type CreateCommunityResult = {
//   community: CommunityAttributes;
//   node: ChainNodeAttributes;
//   role: RoleAttributes;
//   admin_address: string;
// };

export const CreateCommunityErrors = {
  // ReservedId: 'The id is reserved and cannot be used',
  // MustBeWs: 'Node must support websockets on ethereum',
  // InvalidCommunityIdOrUrl:
  //   'Could not determine a valid endpoint for provided community',
  // CommunityAddressExists: 'The address already exists',
  // UserAddressNotExists: 'The user does not own the user_address specified',
  CommunityIDExists:
    'The id for this community already exists, please choose another id',
  CommunityNameExists:
    'The name for this community already exists, please choose another name',
  // ChainNodeIdExists: 'The chain node with this id already exists',
  // CosmosChainNameRequired:
  //   'cosmos_chain_id is a required field. It should be the chain name as registered in the Cosmos Chain Registry.',
  InvalidAddress: 'Address is invalid',
  MissingNodeUrl: 'Missing node url',
  InvalidNode: 'RPC url returned invalid response. Check your node url',
  UnegisteredCosmosChain: `Check https://cosmos.directory. Provided chain_name is not registered in the Cosmos Chain Registry`,
};

async function checkEthereum(
  actor: Actor,
  {
    address,
    node_url,
    eth_chain_id,
  }: z.infer<typeof schemas.CreateCommunity.input>,
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
  const _node_url = node?.private_url ?? node_url;
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
}

async function checkSolana({
  address,
  node_url,
}: z.infer<typeof schemas.CreateCommunity.input>) {
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
async function checkCosmosInput({
  cosmos_chain_id,
  node_url,
}: z.infer<typeof schemas.CreateCommunity.input>) {
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

export function CreateCommunity(): Command<typeof schemas.CreateCommunity> {
  return {
    ...schemas.CreateCommunity,
    auth: [],
    body: async ({ actor, payload }) => {
      const {
        id,
        name,
        node_url,
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
        user_address,
        eth_chain_id,
        cosmos_chain_id,
      } = payload;

      const community = await models.Community.findOne({
        where: { [Op.or]: [{ name }, { id }, { redirect: id }] },
      });
      if (community?.name === name)
        throw new InvalidInput(CreateCommunityErrors.CommunityNameExists);
      if (community?.id === id || community?.redirect === id)
        throw new InvalidInput(CreateCommunityErrors.CommunityIDExists);

      const baseCommunity = await models.Community.findOne({ where: { base } });
      mustExist('Chain Base', baseCommunity);

      // requires super admin privilege for creating Chain/DAO
      if (type === ChainType.Chain || type === ChainType.DAO)
        mustBeSuperAdmin(actor);

      // if not offchain, validate inputs
      if (type !== ChainType.Offchain) {
        if (base === ChainBase.Ethereum) await checkEthereum(actor, payload);
        else if (base === ChainBase.Solana) await checkSolana(payload);
        else if (base === ChainBase.CosmosSDK) await checkCosmosInput(payload);
      }

      // TODO: @rbennettcw can we create communities on behalf of other user addresses?
      // let selectedUserAddress: string;
      // if (user_address) {
      //   const addresses = (await user.getAddresses()).filter(
      //     (a) => a.address === user_address,
      //   );
      //   if (addresses.length === 0) {
      //     throw new AppError(Errors.UserAddressNotExists);
      //   }
      //   selectedUserAddress = addresses[0].address;
      // }

      const uniqueLinksArray = [
        ...new Set(
          [...social_links, website, telegram, discord, element, github].filter(
            (a) => a,
          ),
        ),
      ];

      // == command transaction boundary ==

      // const [node] = await models.ChainNode.scope(
      //   'withPrivateData',
      // ).findOrCreate({
      //   where: { url: node_url },
      //   defaults: {
      //     url: node_url,
      //     eth_chain_id,
      //     cosmos_chain_id,
      //     alt_wallet_url: altWalletUrl,
      //     private_url: privateUrl,
      //     balance_type:
      //       base === ChainBase.CosmosSDK
      //         ? BalanceType.Cosmos
      //         : base === ChainBase.Substrate
      //           ? BalanceType.Substrate
      //           : base === ChainBase.Ethereum
      //             ? BalanceType.Ethereum
      //             : // beyond here should never really happen, but just to make sure...
      //               base === ChainBase.Solana
      //               ? BalanceType.Solana
      //               : undefined,
      //     // use first chain name as node name
      //     name,
      //   },
      // });

      // const createdCommunity = await models.Community.create({
      //   id,
      //   name,
      //   default_symbol,
      //   icon_url,
      //   description,
      //   network,
      //   type,
      //   social_links: uniqueLinksArray,
      //   base,
      //   bech32_prefix,
      //   active: true,
      //   chain_node_id: node.id,
      //   token_name,
      //   has_chain_events_listener: network === 'aave' || network === 'compound',
      //   default_page: DefaultPage.Discussions,
      //   has_homepage: 'true',
      //   collapsed_on_homepage: false,
      //   custom_stages: [],
      //   directory_page_enabled: false,
      //   snapshot_spaces: [],
      //   stages_enabled: true,
      // });

      // const nodeJSON = node.toJSON();
      // delete nodeJSON.private_url;

      // // Warning: looks like state mutations start here, make sure we are using the same transaction
      // await models.Topic.create({
      //   community_id: createdCommunity.id,
      //   name: 'General',
      //   featured_in_sidebar: true,
      // });

      // // try to make admin one of the user's addresses
      // let addressToBeAdmin: AddressInstance | undefined;

      // if (user_address) {
      //   addressToBeAdmin = await models.Address.scope(
      //     'withPrivateData',
      //   ).findOne({
      //     where: {
      //       user_id: user.id,
      //       address: selectedUserAddress,
      //     },
      //     include: [
      //       {
      //         model: models.Community,
      //         where: { base: createdCommunity.base },
      //         required: true,
      //       },
      //     ],
      //   });
      // } else if (createdCommunity.base === ChainBase.Ethereum) {
      //   addressToBeAdmin = await models.Address.scope(
      //     'withPrivateData',
      //   ).findOne({
      //     where: {
      //       user_id: user.id,
      //       address: {
      //         [Op.startsWith]: '0x',
      //       },
      //     },
      //     include: [
      //       {
      //         model: models.Community,
      //         where: { base: createdCommunity.base },
      //         required: true,
      //       },
      //     ],
      //   });
      // } else if (createdCommunity.base === ChainBase.NEAR) {
      //   throw new AppError(Errors.InvalidBase);
      // } else if (createdCommunity.base === ChainBase.Solana) {
      //   addressToBeAdmin = await models.Address.scope(
      //     'withPrivateData',
      //   ).findOne({
      //     where: {
      //       user_id: user.id,
      //       address: {
      //         // This is the regex formatting for solana addresses per their website
      //         [Op.regexp]: '[1-9A-HJ-NP-Za-km-z]{32,44}',
      //       },
      //     },
      //     include: [
      //       {
      //         model: models.Community,
      //         where: { base: createdCommunity.base },
      //         required: true,
      //       },
      //     ],
      //   });
      // } else if (
      //   createdCommunity.base === ChainBase.CosmosSDK &&
      //   // Onchain community can be created by Admin only,
      //   // but we allow offchain cmty to have any creator as admin:
      //   community.type === ChainType.Offchain
      // ) {
      //   // if signed in with Keplr or Magic:
      //   addressToBeAdmin = await models.Address.scope(
      //     'withPrivateData',
      //   ).findOne({
      //     where: {
      //       user_id: user.id,
      //     },
      //     include: [
      //       {
      //         model: models.Community,
      //         where: { base: createdCommunity.base },
      //         required: true,
      //       },
      //     ],
      //   });
      // }

      // if (addressToBeAdmin) {
      //   if (createdCommunity.base === ChainBase.CosmosSDK) {
      //     hex = await bech32ToHex(addressToBeAdmin.address);
      //   }

      //   await models.Address.create({
      //     user_id: user.id,
      //     address: addressToBeAdmin.address,
      //     community_id: createdCommunity.id!,
      //     hex,
      //     verification_token: addressToBeAdmin.verification_token,
      //     verification_token_expires:
      //       addressToBeAdmin.verification_token_expires,
      //     verified: addressToBeAdmin.verified,
      //     wallet_id: addressToBeAdmin.wallet_id,
      //     is_user_default: true,
      //     role: 'admin',
      //     last_active: new Date(),
      //     ghost_address: false,
      //     is_banned: false,
      //   });
      // }
      // == end of command transaction boundary ==

      // return {
      //   community: createdCommunity.toJSON(),
      //   node: nodeJSON,
      //   admin_address: addressToBeAdmin?.address,
      // };
      return community!.toJSON() as Partial<
        z.infer<typeof schemas.CreateCommunity.output>
      >;
    },
  };
}
