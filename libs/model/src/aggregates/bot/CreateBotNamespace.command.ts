import { ServerError, type Command } from '@hicommonwealth/core';
import {
  deployNamespace,
  mustBeProtocolChainId,
} from '@hicommonwealth/evm-protocols';
import { config } from '@hicommonwealth/model';
import * as schemas from '@hicommonwealth/schemas';
import {
  ChainBase,
  ChainNetwork,
  ChainType,
  CommunityTierMap,
  DefaultPage,
} from '@hicommonwealth/shared';
import { models } from '../../database';
import { mustExist } from '../../middleware/guards';

export function CreateBotNamespace(): Command<
  typeof schemas.CreateBotNamespace
> {
  return {
    ...schemas.CreateBotNamespace,
    auth: [],
    body: async ({ payload }) => {
      const { name, description, icon_url, admin_address, chain_id } = payload;
      mustBeProtocolChainId(chain_id);

      const node = await models.ChainNode.scope('withPrivateData').findOne({
        where: {
          eth_chain_id: chain_id,
        },
      });
      mustExist('chainNode', node);

      if (!config.WEB3.CONTEST_BOT_PRIVATE_KEY)
        throw new ServerError('Contest bot private key not set!');

      const namespaceAddress = await deployNamespace(
        name,
        admin_address,
        admin_address,
        {
          rpc: node.private_url!,
          eth_chain_id: chain_id,
        },
        config.WEB3.CONTEST_BOT_PRIVATE_KEY,
      );

      const base = ChainBase.Ethereum;
      const type = ChainType.Token;

      const baseCommunity = await models.Community.findOne({ where: { base } });
      mustExist('Chain Base', baseCommunity);
      const symbol = name.toUpperCase().slice(0, 4);
      const community = await models.Community.create({
        id: name
          .replace(/[^A-Za-z0-9 -]/g, '')
          .replace(/(\s|-)+/g, '-')
          .replace(/^-|-$/g, '')
          .toLowerCase(),
        name,
        tier: CommunityTierMap.Unverified,
        spam_tier_level: -1,
        default_symbol: symbol,
        icon_url,
        description,
        network: ChainNetwork.Ethereum,
        type,
        social_links: [],
        base,
        bech32_prefix: node.bech32,
        active: true,
        chain_node_id: node.id,
        token_name: name,
        default_page: DefaultPage.Discussions,
        has_homepage: 'true',
        collapsed_on_homepage: false,
        custom_stages: [],
        directory_page_enabled: false,
        snapshot_spaces: [],
        stages_enabled: true,
      });
      return {
        community,
        namespaceAddress,
      };
    },
  };
}
