import { type Command } from '@hicommonwealth/core';
import { commonProtocol as cp } from '@hicommonwealth/evm-protocols';
import * as schemas from '@hicommonwealth/schemas';
import {
  ChainBase,
  ChainNetwork,
  ChainType,
  DefaultPage,
} from '@hicommonwealth/shared';
import { models } from '../database';
import { mustExist } from '../middleware/guards';
import { deployNamespace } from '../services/commonProtocol/contestHelper';

export function CreateContest(): Command<typeof schemas.CreateBotNamespace> {
  return {
    ...schemas.CreateBotNamespace,
    auth: [],
    body: async ({ payload }) => {
      const { name, description, icon_url, admin_address, chain_id } = payload;
      const namespaceFactory =
        cp.factoryContracts[chain_id as cp.ValidChains].factory;

      const node = await models.ChainNode.scope('withPrivateData').findOne({
        where: {
          eth_chain_id: chain_id,
        },
      });
      mustExist('chainNode', node);

      const namespaceAddress = await deployNamespace(
        namespaceFactory,
        name,
        admin_address,
        admin_address,
        node?.private_url!,
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
        has_chain_events_listener: true,
      });
      return {
        community,
        namespaceAddress,
      };
    },
  };
}
