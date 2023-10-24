// import { assert } from 'chai';
// import { ChainBase, ChainType } from 'common-common/src/types';
// import { ServerCommunitiesController } from '../../../server/controllers/server_communities_controller';
// import { __updateCommunity } from '../../../server/controllers/server_communities_methods/update_community';
// import models from '../../../server/database';
// import { postReq, res } from '../../unit/unitHelpers';
// import { resetDatabase } from '../../util/resetDatabase';
//
// const baseRequest: UpdateChainReq = {
//   id: 'edgeware',
//   name: 'Edgeware',
//   chain_node_id: 1,
//   default_symbol: 'EDG',
//   network: null,
//   base: ChainBase.Substrate,
//   icon_url: '/static/img/protocols/edg.png',
//   active: true,
//   type: ChainType.Chain
// };
//
// describe('UpdateChain Tests', () => {
//   before(async () => {
//     await resetDatabase();
//   });
//
//   it('Correctly updates chain', async () => {
//     const controller = new ServerCommunitiesController(models, null, null);
//     const response = (controller.updateCommunity(
//       postReq({
//         directory_page_enabled: true,
//         directory_page_chain_node_id: 1,
//         ...baseRequest
//       }, { models, userAttributes: { email: '', id: 1, isAdmin: true } }),
//       )
//     )) as any;
//
//     assert.equal(response.result.directory_page_enabled, true);
//     assert.equal(response.result.directory_page_chain_node_id, 1);
//   });
// });