import { assert } from 'chai';
import { ChainBase, ChainType } from 'common-common/src/types';
import models from '../../../server/database';
import updateChain, { UpdateChainReq } from '../../../server/routes/updateChain';
import { postReq, res } from '../../unit/unitHelpers';
import { resetDatabase } from '../../util/resetDatabase';

const baseRequest: UpdateChainReq = {
  id: 'edgeware',
  name: 'Edgeware',
  chain_node_id: 1,
  default_symbol: 'EDG',
  network: null,
  base: ChainBase.Substrate,
  icon_url: '/static/img/protocols/edg.png',
  active: true,
  type: ChainType.Chain
};

describe('UpdateChain Tests', () => {
  before(async () => {
    await resetDatabase();
  });

  it('Correctly updates chain', async () => {
    const response = (await updateChain(
      models,
      postReq({
        directory_page_enabled: true,
        directory_page_chain_node_id: 1,
        ...baseRequest
      }, { models, userAttributes: { email: '', id: 1, isAdmin: true } }),
      res(),
      null
    )) as any;

    assert.equal(response.result.directory_page_enabled, true);
    assert.equal(response.result.directory_page_chain_node_id, 1);
  });
});