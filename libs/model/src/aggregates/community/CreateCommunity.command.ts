import {
  config,
  InvalidInput,
  InvalidState,
  type Command,
} from '@hicommonwealth/core';
import { config as modelConfig } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import {
  alchemyGetTokenPrices,
  bech32ToHex,
  ChainBase,
  ChainNetwork,
  ChainType,
  CommunityTierMap,
  DefaultPage,
  DisabledCommunitySpamTier,
} from '@hicommonwealth/shared';
import { Op } from 'sequelize';
import { models } from '../../database';
import {
  authVerified,
  mustBeSuperAdmin,
  mustExist,
  tiered,
} from '../../middleware';
import { emitEvent } from '../../utils';
import { findCompatibleAddress } from '../../utils/findBaseAddress';

export const CreateCommunityErrors = {
  CommunityIDExists: 'The ID for this community already exists',
  CommunityNameExists:
    'The name for this community already exists, please choose another name',
  CommunityRedirectExists:
    'The redirect for this community already exists, please choose another redirect',
  InvalidEthereumChainId: 'Ethereum chain ID not provided or unsupported',
  CosmosChainNameRequired:
    'cosmos_chain_id is a required field. It should be the chain name as registered in the Cosmos Chain Registry.',
  InvalidAddress: 'Address is invalid',
  InvalidBase: 'Must provide valid chain base',
  MissingNodeUrl: 'Missing node url',
  InvalidNode: 'RPC url returned invalid response. Check your node url',
  // eslint-disable-next-line max-len
  UnegisteredCosmosChain: `Check https://cosmos.directory. Provided chain_name is not registered in the Cosmos Chain Registry`,
  TokenAddressRequired:
    'Token address is required when creating a community from an indexer',
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
    case ChainBase.Sui:
      return ChainNetwork.Sui;
  }
}

export function CreateCommunity(): Command<typeof schemas.CreateCommunity> {
  return {
    ...schemas.CreateCommunity,
    auth: [
      authVerified(),
      tiered({ creates: true }),
      // turnstile({ widgetName: 'create-community' }),
    ],
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
        community_indexer_id,
        token_address,
        tags,
        allow_tokenized_threads,
        thread_purchase_token,
      } = payload;

      const community = await models.Community.findOne({
        where: { [Op.or]: [{ name }, { id }, { redirect: id }] },
      });
      if (community) {
        if (community.id === id) {
          throw new InvalidInput(CreateCommunityErrors.CommunityIDExists);
        } else if (community.name === name) {
          throw new InvalidInput(CreateCommunityErrors.CommunityNameExists);
        } else if (community.redirect === id) {
          throw new InvalidInput(CreateCommunityErrors.CommunityRedirectExists);
        }
      }
      if (community_indexer_id && !token_address) {
        throw new InvalidInput(CreateCommunityErrors.TokenAddressRequired);
      }

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
            tier: CommunityTierMap.Unverified,
            spam_tier_level: DisabledCommunitySpamTier,
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
            community_indexer_id,
            allow_tokenized_threads,
            thread_purchase_token,
            namespace_verified: false,
            environment: config.APP_ENV,
            profile_count: 1,
          },
          { transaction },
        );

        if (community_indexer_id && token_address) {
          const price = await alchemyGetTokenPrices({
            alchemyApiKey: modelConfig.ALCHEMY.APP_KEYS.PRIVATE,
            tokenSources: [
              {
                contractAddress: token_address,
                alchemyNetworkId: node.alchemy_metadata!.network_id!,
              },
            ],
          });
          console.log('price', price);
          const hasPricing =
            Array.isArray(price?.data) && price.data.length > 0;
          await models.PinnedToken.create(
            {
              community_id: id,
              contract_address: token_address,
              chain_node_id: node.id!,
              has_pricing: hasPricing,
            },
            { transaction },
          );
        }

        // add tag associations
        if (tags.length > 0) {
          const existingTags = await models.Tags.findAll({
            where: {
              name: tags,
            },
          });
          if (existingTags.length !== tags.length) {
            throw new InvalidState('Invalid tags');
          }
          for (const t of existingTags) {
            await models.CommunityTags.create(
              {
                community_id: id,
                tag_id: t.id!,
              },
              { transaction },
            );
          }
        }

        await models.Topic.create(
          {
            community_id: id,
            name: 'General',
            description: 'General discussions',
            featured_in_sidebar: true,
            featured_in_new_post: false,
            allow_tokenized_threads: false,
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
            role: 'admin',
            last_active: new Date(),
            ghost_address: false,
            is_banned: false,
            oauth_provider: admin_address.oauth_provider,
            oauth_username: admin_address.oauth_username,
            oauth_email: admin_address.oauth_email,
            oauth_email_verified: admin_address.oauth_email_verified,
            oauth_phone_number: admin_address.oauth_phone_number,
          },
          { transaction },
        );

        // only emit the event if the community was not created by an indexer
        if (!community_indexer_id) {
          await emitEvent(
            models.Outbox,
            [
              {
                event_name: 'CommunityCreated',
                event_payload: {
                  community_id: id,
                  user_id: user.id!,
                  social_links: uniqueLinksArray,
                  referrer_address: user.referred_by_address ?? undefined,
                  created_at: created.created_at!,
                },
              },
            ],
            transaction,
          );
        }
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
