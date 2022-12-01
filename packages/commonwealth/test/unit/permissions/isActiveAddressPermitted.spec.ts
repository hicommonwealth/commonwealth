// import { assert, expect } from 'chai';
// import { isActiveAddressPermitted } from 'controllers/server/roles';
// import ChainInfo from 'models/ChainInfo';
// import RoleInfo from 'models/RoleInfo';
// import RolePermission from 'models/RolePermission';
// import { Action } from 'common-common/src/permissions';
// import { ChainBase, ChainNetwork } from 'common-common/src/types';

// describe('isActiveAddressPermitted() unit tests', () => {
//   it('should throw error if there are no addresses with permitted for the action', () => {
//     const roleObjects: RoleInfo[] = [
//       {
//         id: 1,
//         permission: RolePermission.admin,
//         is_user_default: false,
//         address_id: 1,
//         address: '0x123',
//         address_chain: 'edgeware',
//         chain_id: 'edgeware',
//       },
//       {
//         id: 2,
//         permission: RolePermission.member,
//         is_user_default: true,
//         address_id: 2,
//         address: '0x456',
//         address_chain: 'edgeware',
//         chain_id: 'edgeware',
//       },
//     ];
//     const chainInfo: ChainInfo = ChainInfo.fromJSON({
//       id: 'edgeware',
//       network: ChainNetwork.Edgeware,
//       default_symbol: 'EDG',
//       name: 'Edgeware',
//       icon_url: 'https://commonwealth.im/static/img/protocols/edgeware.png',
//       description: 'Edgeware is a community-driven blockchain project.',
//       website: 'https://edgewa.re',
//       telegram: 'https://t.me/edgewareEN',
//       discord: 'https://discord.gg/edgeware',
//       element: 'https://app.element.io/#/room/#edgeware:matrix.org',
//       github: '',
//       stages_enabled: false,
//       custom_stages: '',
//       custom_domain: '',
//       snapshot: [],
//       terms: '',
//       block_explorer_ids: {},
//       collapsed_on_homepage: false,
//       default_summary_view: true,
//       adminsAndMods: [],
//       base: ChainBase.Substrate,
//       type: 'chain',
//       default_allow_permissions: BigInt(0),
//       default_deny_permissions: BigInt(0),
//       ss58_prefix: '7',
//       bech32_prefix: 'edgeware',
//       substrate_spec: null,
//       token_name: 'EDG',
//       Contracts: [],
//       ChainNode: [],
//       admin_only_polling: false,
//       community_roles: [],
//     });

//     assert.deepEqual(
//       isActiveAddressPermitted(roleObjects, chainInfo, Action.CREATE_THREAD), false
//     );
//   });
// });
