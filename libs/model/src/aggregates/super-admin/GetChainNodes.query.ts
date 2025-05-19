import { Query } from '@hicommonwealth/core';
import * as schemas from '@hicommonwealth/schemas';
import { models } from '../../database';

export function GetChainNodes(): Query<typeof schemas.GetChainNodes> {
  return {
    ...schemas.GetChainNodes,
    auth: [],
    secure: false,
    body: async () => {
      const nodes = await models.ChainNode.findAll();
      return nodes.map((node) => node.toJSON());
    },
  };
}
