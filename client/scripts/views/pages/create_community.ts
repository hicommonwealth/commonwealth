import 'pages/manage_community.scss';
import 'pages/create_community.scss';

import BN from 'bn.js';
import m from 'mithril';
import $ from 'jquery';
import app from 'state';
import { slugify } from 'utils';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import mixpanel from 'mixpanel-browser';
import { Table, Tabs, TabItem, Button, MenuDivider } from 'construct-ui';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { constructSubstrateUrl } from 'substrate';
import { NearAccount } from 'controllers/chain/near/account';
import Near from 'controllers/chain/near/main';
import { isAddress } from 'web3-utils';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import {
  InputPropertyRow,
  TogglePropertyRow,
  SelectPropertyRow,
} from './manage_community/metadata_rows';
import { initAppState } from '../../app';
import { ALIGN_CENTER } from 'construct-ui/lib/esm/components/icon/generated/IconNames';

enum CommunityType {
  OffchainCommunity = 'offchain',
  Erc20Community = 'erc20',
  SubstrateCommunity = 'substrate',
  SputnikDao = 'sputnik',
}

interface OffchainCommunityFormAttrs {}
interface OffchainCommunityFormState {
  disabled: boolean;
  error: string;
  success: string | boolean;
  name: string;
  description: string;
  iconUrl: string;
  invitesEnabled: boolean;
  privacyEnabled: boolean;
  isAuthenticatedForum: boolean;
  website: string;
  discord: string;
  element: string;
  telegram: string;
  github: string;
  defaultChain: string;
  saving: boolean;
}

const OffchainCommunityForm: m.Component<
  OffchainCommunityFormAttrs,
  OffchainCommunityFormState
> = {
  oninit: (vnode) => {
    vnode.state.name = '';
    vnode.state.description = '';
    vnode.state.iconUrl = '';
    vnode.state.website = '';
    vnode.state.discord = '';
    vnode.state.element = '';
    vnode.state.telegram = '';
    vnode.state.github = '';
    vnode.state.isAuthenticatedForum = false;
    vnode.state.privacyEnabled = false;
    vnode.state.invitesEnabled = false;
    vnode.state.saving = false;
    const defaultChains = app.config.chains
      .getAll()
      .map((_) => _.id)
      .filter((chain) => app.user.getAllRolesInCommunity({ chain }).length > 0);
    vnode.state.defaultChain =
      defaultChains.length > 0 ? defaultChains[0] : 'ethereum';
  },
  view: (vnode) => {
    const defaultChains = app.config.chains
      .getAll()
      .map((_) => _.id)
      .filter((chain) => app.user.getAllRolesInCommunity({ chain }).length > 0);

    return m('.class', [
      m('.CommunityMetadataManagementTable', [
        m(
          Table,
          {
            bordered: false,
            interactive: false,
            striped: false,
            class: 'metadata-management-table',
          },
          [
            m(InputPropertyRow, {
              title: 'Name',
              defaultValue: vnode.state.name,
              onChangeHandler: (v) => {
                vnode.state.name = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Description',
              defaultValue: vnode.state.description,
              onChangeHandler: (v) => {
                vnode.state.description = v;
              },
              textarea: true,
            }),
            m(InputPropertyRow, {
              title: 'Website',
              defaultValue: vnode.state.website,
              placeholder: 'https://example.com',
              onChangeHandler: (v) => {
                vnode.state.website = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Discord',
              defaultValue: vnode.state.discord,
              placeholder: 'https://discord.com/invite',
              onChangeHandler: (v) => {
                vnode.state.discord = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Element',
              defaultValue: vnode.state.element,
              placeholder: 'https://matrix.to/#',
              onChangeHandler: (v) => {
                vnode.state.element = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Telegram',
              defaultValue: vnode.state.telegram,
              placeholder: 'https://t.me',
              onChangeHandler: (v) => {
                vnode.state.telegram = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Github',
              defaultValue: vnode.state.github,
              placeholder: 'https://github.com',
              onChangeHandler: (v) => {
                vnode.state.github = v;
              },
            }),
            m(TogglePropertyRow, {
              title: 'Privacy',
              defaultValue: vnode.state.privacyEnabled,
              onToggle: (checked) => {
                vnode.state.privacyEnabled = checked;
              },
              caption: (checked) =>
                checked
                  ? 'Threads are private to members'
                  : 'Threads are visible to the public',
            }),
            m(TogglePropertyRow, {
              title: 'Invites',
              defaultValue: vnode.state.invitesEnabled,
              onToggle: (checked) => {
                vnode.state.invitesEnabled = checked;
              },
              caption: (checked) =>
                checked
                  ? 'Anyone can invite new members'
                  : 'Admins/mods can invite new members',
            }),
            m(SelectPropertyRow, {
              title: 'Default Chain',
              options: defaultChains,
              value: vnode.state.defaultChain,
              onchange: (value) => {
                vnode.state.defaultChain = value;
              },
            }),
          ]
        ),
        m(Button, {
          label: 'Save changes',
          intent: 'primary',
          disabled: vnode.state.saving,
          onclick: async (e) => {
            const {
              name,
              description,
              iconUrl,
              website,
              discord,
              element,
              telegram,
              github,
              invitesEnabled,
              privacyEnabled,
              isAuthenticatedForum,
              defaultChain,
            } = vnode.state;

            vnode.state.saving = true;

            $.post(`${app.serverUrl()}/createCommunity`, {
              name,
              description,
              icon_url: iconUrl,
              website,
              discord,
              element,
              telegram,
              github,
              invites_enabled: invitesEnabled,
              privacy_enabled: privacyEnabled,
              is_authenticated_forum: isAuthenticatedForum,
              default_chain: defaultChain,
              jwt: app.user.jwt,
            })
              .then(async (res) => {
                await initAppState(false);
                m.route.set(`/${res.result.id}`);
              })
              .catch((err: any) => {
                notifyError(
                  err.responseJSON?.error || 'Creating new community failed'
                );
              })
              .always(() => {
                vnode.state.saving = false;
              });
          },
        }),
      ]),
    ]);
  },
};

interface SubstrateFormAttrs {}

interface SubstrateFormState {
  name: string;
  nodeUrl: string;
  symbol: string;
  website: string;
  discord: string;
  element: string;
  telegram: string;
  github: string;
  description: string;
  substrate_spec: string;
  saving: boolean;
}

const SubstrateForm: m.Component<SubstrateFormAttrs, SubstrateFormState> = {
  oninit: (vnode) => {
    vnode.state.name = '';
    vnode.state.nodeUrl = '';
    vnode.state.symbol = '';
    vnode.state.website = '';
    vnode.state.discord = '';
    vnode.state.element = '';
    vnode.state.telegram = '';
    vnode.state.github = '';
    vnode.state.description = '';
    vnode.state.substrate_spec = '';
    vnode.state.saving = false;
  },
  view: (vnode) => {
    return m('.class', [
      m('.CommunityMetadataManagementTable', [
        m(
          Table,
          {
            bordered: false,
            interactive: false,
            striped: false,
            class: 'metadata-management-table',
          },
          [
            m(InputPropertyRow, {
              title: 'Name',
              defaultValue: vnode.state.name,
              onChangeHandler: (v) => {
                vnode.state.name = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Node URL',
              defaultValue: vnode.state.nodeUrl,
              placeholder: 'wss://',
              onChangeHandler: (v) => {
                vnode.state.nodeUrl = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Symbol',
              defaultValue: vnode.state.symbol,
              placeholder: 'XYZ',
              onChangeHandler: (v) => {
                vnode.state.symbol = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Description',
              defaultValue: vnode.state.description,
              onChangeHandler: (v) => {
                vnode.state.description = v;
              },
              textarea: true,
            }),
            m(InputPropertyRow, {
              title: 'Spec (JSON)',
              defaultValue: vnode.state.substrate_spec,
              textarea: true,
              placeholder:
                '{"types": {"Address": "MultiAddress", "ChainId": "u8", "Reveals": "Vec<(AccountId, Vec<VoteOutcome>)>", "Balance2": "u128", "VoteData": {"stage": "VoteStage", "initiator": "AccountId", "vote_type": "VoteType", "tally_type": "TallyType", "is_commit_reveal": "bool"}, "VoteType": {"_enum": ["Binary", "MultiOption", "RankedChoice"]}, "TallyType": {"_enum": ["OnePerson", "OneCoin"]}, "VoteStage": {"_enum": ["PreVoting", "Commit", "Voting", "Completed"]}, "ResourceId": "[u8; 32]", "VoteRecord": {"id": "u64", "data": "VoteData", "reveals": "Reveals", "outcomes": "Vec<VoteOutcome>", "commitments": "Commitments"}, "AccountInfo": "AccountInfoWithRefCount", "Commitments": "Vec<(AccountId, VoteOutcome)>", "VoteOutcome": "[u8; 32]", "VotingTally": "Option<Vec<(VoteOutcome, u128)>>", "DepositNonce": "u64", "LookupSource": "MultiAddress", "ProposalTitle": "Bytes", "ProposalVotes": {"staus": "ProposalStatus", "expiry": "BlockNumber", "votes_for": "Vec<AccountId>", "votes_against": "Vec<AccountId>"}, "ProposalRecord": {"index": "u32", "stage": "VoteStage", "title": "Text", "author": "AccountId", "vote_id": "u64", "contents": "Text", "transition_time": "u32"}, "ProposalStatus": {"_enum": ["Initiated", "Approved", "Rejected"]}, "ProposalContents": "Bytes"}}',
              onChangeHandler: (v) => {
                vnode.state.substrate_spec = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Website',
              defaultValue: vnode.state.website,
              placeholder: 'https://example.com',
              onChangeHandler: (v) => {
                vnode.state.website = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Discord',
              defaultValue: vnode.state.discord,
              placeholder: 'https://discord.com/invite',
              onChangeHandler: (v) => {
                vnode.state.discord = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Element',
              defaultValue: vnode.state.element,
              placeholder: 'https://matrix.to/#',
              onChangeHandler: (v) => {
                vnode.state.element = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Telegram',
              defaultValue: vnode.state.telegram,
              placeholder: 'https://t.me',
              onChangeHandler: (v) => {
                vnode.state.telegram = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Github',
              defaultValue: vnode.state.github,
              placeholder: 'https://github.com',
              onChangeHandler: (v) => {
                vnode.state.github = v;
              },
            }),
          ]
        ),
        m(Button, {
          label: 'Test',
          onclick: async (e) => {
            // deinit substrate API if one exists
            if (app.chain?.apiInitialized) {
              await app.chain.deinit();
            }

            // create new API
            const provider = new WsProvider(
              constructSubstrateUrl(vnode.state.nodeUrl),
              false
            );
            try {
              await provider.connect();
              const api = await ApiPromise.create({
                throwOnConnect: true,
                provider,
                ...JSON.parse(vnode.state.substrate_spec),
              });
              await api.disconnect();
              notifySuccess('Test has passed');
            } catch (err) {
              console.error(err.message);
              notifyError('Test API initialization failed');
            }
          },
        }),
        m(Button, {
          label: 'Save changes',
          intent: 'primary',
          disabled: vnode.state.saving,
          onclick: async (e) => {
            const {
              name,
              description,
              nodeUrl,
              symbol,
              website,
              discord,
              element,
              telegram,
              github,
              substrate_spec,
            } = vnode.state;
            try {
              JSON.parse(substrate_spec);
            } catch (err) {
              notifyError('Spec provided has invalid JSON');
              return;
            }
            vnode.state.saving = true;
            $.post(`${app.serverUrl()}/addChainNode`, {
              name,
              description,
              node_url: nodeUrl,
              symbol,
              website,
              discord,
              element,
              telegram,
              github,
              substrate_spec,
              jwt: app.user.jwt,
              type: ChainType.Chain,
              id: slugify(name),
              base: ChainBase.Substrate,
              network: slugify(name),
            })
              .then(async (res) => {
                await initAppState(false);
                m.route.set(`/${res.result.chain}`);
              })
              .catch((err: any) => {
                notifyError(
                  err.responseJSON?.error || 'Creating new community failed'
                );
              })
              .always(() => {
                vnode.state.saving = false;
              });
          },
        }),
      ]),
      m(Button, {
        label: 'Test',
        onclick: async (e) => {
          // deinit substrate API if one exists
          if (app.chain?.apiInitialized) {
            await app.chain.deinit();
          }

          // create new API
          const provider = new WsProvider(
            constructSubstrateUrl(vnode.state.nodeUrl),
            false
          );
          try {
            await provider.connect();
            const api = await ApiPromise.create({
              throwOnConnect: true,
              provider,
              ...JSON.parse(vnode.state.substrate_spec),
            });
            await api.disconnect();
            notifySuccess('Test has passed');
          } catch (err) {
            console.error(err.message);
            notifyError('Test API initialization failed');
          }
        },
      }),
      m(Button, {
        label: 'Save changes',
        intent: 'primary',
        disabled: vnode.state.saving,
        onclick: async (e) => {
          const {
            name,
            description,
            nodeUrl,
            symbol,
            website,
            discord,
            element,
            telegram,
            github,
            substrate_spec,
          } = vnode.state;
          try {
            JSON.parse(substrate_spec);
          } catch (err) {
            notifyError('Spec provided has invalid JSON');
            return;
          }
          vnode.state.saving = true;
          $.post(`${app.serverUrl()}/addChainNode`, {
            name,
            description,
            node_url: nodeUrl,
            symbol,
            website,
            discord,
            element,
            telegram,
            github,
            substrate_spec,
            jwt: app.user.jwt,
            type: ChainType.Chain,
            id: slugify(name),
            base: ChainBase.Substrate,
            network: slugify(name),
          })
            .then(async (res) => {
              await initAppState(false);
              m.route.set(`/${res.result.chain}`);
            })
            .catch((err: any) => {
              notifyError(
                err.responseJSON?.error || 'Creating new community failed'
              );
            })
            .always(() => {
              vnode.state.saving = false;
            });
        },
      }),
    ]);
  },
};

interface ERC20FormAttrs {}

interface ERC20FormState {
  chain_id: string;
  url: string;
  address: string;
  id: string;
  name: string;
  symbol: string;
  icon_url: string;
  website: string;
  discord: string;
  element: string;
  telegram: string;
  github: string;
  description: string;
  saving: boolean;
  loaded: boolean;
  error: string;
}

const ERC20Form: m.Component<ERC20FormAttrs, ERC20FormState> = {
  oninit: (vnode) => {
    vnode.state.chain_id = '1';
    vnode.state.url = 'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr';
    vnode.state.address = '';
    vnode.state.id = '';
    vnode.state.name = '';
    vnode.state.symbol = '';
    vnode.state.icon_url = '';
    vnode.state.website = '';
    vnode.state.discord = '';
    vnode.state.element = '';
    vnode.state.telegram = '';
    vnode.state.github = '';
    vnode.state.description = '';
    vnode.state.saving = false;
    vnode.state.loaded = false;
    vnode.state.error = '';
  },
  view: (vnode) => {
    const validAddress = isAddress(vnode.state.address);
    const disableField = !validAddress || !vnode.state.loaded;

    const updateTokenForum = async () => {
      if (!vnode.state.address || !vnode.state.chain_id) return;
      try {
        const res = await $.get(`${app.serverUrl()}/getTokenForum`, {
          address: vnode.state.address,
          chain_id: vnode.state.chain_id,
          allowUncached: true,
        });
        if (res.status === 'Success') {
          vnode.state.name = res?.result?.chain?.name || '';
          vnode.state.id = slugify(vnode.state.name);
          vnode.state.symbol = res?.result?.chain?.symbol || '';
          vnode.state.icon_url =
            res?.result?.chain?.icon_url || '';
          vnode.state.description =
            res?.result?.chain?.description || '';
          vnode.state.website = res?.result?.chain?.website || '';
          vnode.state.discord = res?.result?.chain?.discord || '';
          vnode.state.element = res?.result?.chain?.element || '';
          vnode.state.telegram =
            res?.result?.chain?.telegram || '';
          vnode.state.github = res?.result?.chain?.github || '';
          vnode.state.loaded = true;
        } else {
          notifyError(res.message);
        }
      } catch (err) {
        notifyError(
          err.responseJSON?.error ||
          'Failed to load Token Information'
        );
      }
    }

    return m('.class', [
      m('.CommunityMetadataManagementTable', [
        m(
          Table,
          {
            bordered: false,
            interactive: false,
            striped: false,
            class: 'metadata-management-table',
          },
          [
            m(InputPropertyRow, {
              title: 'Chain ID',
              defaultValue: vnode.state.chain_id,
              placeholder: '1',
              onChangeHandler: async (v) => {
                vnode.state.chain_id = v;
                vnode.state.loaded = false;
                if (+v) {
                  updateTokenForum();
                }
              }
            }),
            m(InputPropertyRow, {
              title: 'Address',
              defaultValue: vnode.state.address,
              placeholder: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
              onChangeHandler: (v) => {
                vnode.state.address = v;
                vnode.state.loaded = false;
                if (isAddress(v)) {
                  updateTokenForum();
                }
              },
            }),
            m(InputPropertyRow, {
              title: 'Name',
              defaultValue: vnode.state.name,
              disabled: disableField,
              onChangeHandler: (v) => {
                vnode.state.name = v;
                vnode.state.id = slugify(v);
              },
            }),
            m(InputPropertyRow, {
              title: 'ID',
              defaultValue: vnode.state.id,
              value: vnode.state.id,
              disabled: disableField,
              onChangeHandler: (v) => {
                vnode.state.id = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Symbol',
              disabled: disableField,
              defaultValue: vnode.state.symbol,
              placeholder: 'XYZ',
              onChangeHandler: (v) => {
                vnode.state.symbol = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Icon URL',
              disabled: disableField,
              defaultValue: vnode.state.icon_url,
              placeholder: 'https://',
              onChangeHandler: (v) => {
                vnode.state.icon_url = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Description',
              disabled: disableField,
              defaultValue: vnode.state.description,
              onChangeHandler: (v) => {
                vnode.state.description = v;
              },
              textarea: true,
            }),
            m(InputPropertyRow, {
              title: 'Website',
              disabled: disableField,
              defaultValue: vnode.state.website,
              placeholder: 'https://example.com',
              onChangeHandler: (v) => {
                vnode.state.website = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Discord',
              disabled: disableField,
              defaultValue: vnode.state.discord,
              placeholder: 'https://discord.com/invite',
              onChangeHandler: (v) => {
                vnode.state.discord = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Element',
              disabled: disableField,
              defaultValue: vnode.state.element,
              placeholder: 'https://matrix.to/#',
              onChangeHandler: (v) => {
                vnode.state.element = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Telegram',
              disabled: disableField,
              defaultValue: vnode.state.telegram,
              placeholder: 'https://t.me',
              onChangeHandler: (v) => {
                vnode.state.telegram = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Github',
              disabled: disableField,
              defaultValue: vnode.state.github,
              placeholder: 'https://github.com',
              onChangeHandler: (v) => {
                vnode.state.github = v;
              },
            }),
          ]
        ),
        m(Button, {
          label: 'Save changes',
          intent: 'primary',
          disabled: vnode.state.saving || !validAddress || !vnode.state.loaded,
          onclick: async (e) => {
            const {
              address,
              id,
              name,
              description,
              symbol,
              icon_url,
              website,
              discord,
              element,
              telegram,
              github,
              chain_id,
              url,
            } = vnode.state;
            vnode.state.saving = true;
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                address,
                id,
                name,
                description,
                icon_url,
                symbol,
                website,
                discord,
                element,
                telegram,
                github,
                jwt: app.user.jwt,
                type: ChainType.Token,
                base: ChainBase.Ethereum,
                network: ChainNetwork.ERC20,
                node_url: url,
                eth_chain_id: chain_id,
              });
              await initAppState(false);
              m.route.set(`/${res.result.chain?.id}`);
            } catch (err) {
              notifyError(
                err.responseJSON?.error ||
                'Creating new ERC20 community failed'
              );
            } finally {
              vnode.state.saving = false;
            }
          },
        }),
      ]),
    ]);
  },
};

interface SputnikFormAttrs {}

interface SputnikFormState {
  name: string;
  description: string;
  initialValue: string;
  website: string;
  discord: string;
  element: string;
  telegram: string;
  github: string;
  createNew: boolean;
  saving: boolean;
}

const SputnikForm: m.Component<SputnikFormAttrs, SputnikFormState> = {
  oninit: (vnode) => {
    vnode.state.name = '';
    vnode.state.initialValue = '';
    vnode.state.website = '';
    vnode.state.discord = '';
    vnode.state.element = '';
    vnode.state.telegram = '';
    vnode.state.github = '';
    vnode.state.description = '';
    vnode.state.createNew = false;
    vnode.state.saving = false;
  },
  view: (vnode) => {
    return m('.class', [
      m('.CommunityMetadataManagementTable', [
        m(
          Table,
          {
            bordered: false,
            interactive: false,
            striped: false,
            class: 'metadata-management-table',
          },
          [
            m(InputPropertyRow, {
              title: 'Name',
              defaultValue: vnode.state.name,
              onChangeHandler: (v) => {
                vnode.state.name = v.toLowerCase();
              },
              placeholder: 'genesis',
            }),
            m(InputPropertyRow, {
              title: 'Description',
              defaultValue: vnode.state.description,
              onChangeHandler: (v) => {
                vnode.state.description = v;
              },
              textarea: true,
            }),
            m(TogglePropertyRow, {
              title: 'Deploy',
              defaultValue: vnode.state.createNew,
              onToggle: (checked) => {
                vnode.state.createNew = checked;
              },
              caption: (checked) =>
                app.chain?.base !== ChainBase.NEAR
                  ? 'Must be on NEAR chain to deploy'
                  : !(app.user?.activeAccount instanceof NearAccount)
                  ? 'Must log into NEAR account to deploy'
                  : checked
                  ? 'Deploying new DAO'
                  : 'Adding existing DAO',
              disabled:
                !(app.user?.activeAccount instanceof NearAccount) ||
                app.chain?.base !== ChainBase.NEAR,
            }),
            m(InputPropertyRow, {
              title: 'Initial Bond (Must be >= Ⓝ 5)',
              defaultValue: vnode.state.initialValue,
              disabled: !vnode.state.createNew,
              onChangeHandler: (v) => {
                vnode.state.initialValue = v;
              },
              placeholder: '5',
            }),
            // TODO: add divider to distinguish on-chain data
            m(InputPropertyRow, {
              title: 'Website',
              defaultValue: vnode.state.website,
              placeholder: 'https://example.com',
              onChangeHandler: (v) => {
                vnode.state.website = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Discord',
              defaultValue: vnode.state.discord,
              placeholder: 'https://discord.com/invite',
              onChangeHandler: (v) => {
                vnode.state.discord = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Element',
              defaultValue: vnode.state.element,
              placeholder: 'https://matrix.to/#',
              onChangeHandler: (v) => {
                vnode.state.element = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Telegram',
              defaultValue: vnode.state.telegram,
              placeholder: 'https://t.me',
              onChangeHandler: (v) => {
                vnode.state.telegram = v;
              },
            }),
            m(InputPropertyRow, {
              title: 'Github',
              defaultValue: vnode.state.github,
              placeholder: 'https://github.com',
              onChangeHandler: (v) => {
                vnode.state.github = v;
              },
            }),
          ]
        ),
        m(Button, {
          label: 'Save changes',
          intent: 'primary',
          disabled: vnode.state.saving,
          onclick: async (e) => {
            if (!app.chain || !app.activeChainId().includes('near')) {
              notifyError('Must be on NEAR or NEAR testnet to add Sputnik DAO.');
              return;
            }
            const {
              name,
              description,
              initialValue,
              website,
              discord,
              element,
              telegram,
              github,
              createNew,
            } = vnode.state;
            vnode.state.saving = true;
            const isMainnet = (app.chain as Near).chain.isMainnet;
            const id = isMainnet
              ? `${name}.sputnik-dao.near`
              : `${name}.sputnikv2.testnet`;
            const addChainNodeArgs = {
              name: id,
              description,
              node_url: isMainnet
                ? 'https://rpc.mainnet.near.org'
                : 'https://rpc.testnet.near.org',
              symbol: isMainnet ? 'NEAR' : 'tNEAR',
              website,
              discord,
              element,
              telegram,
              github,
              jwt: app.user.jwt,
              type: ChainType.DAO,
              id,
              base: ChainBase.NEAR,
              network: ChainNetwork.Sputnik,
            };
            if (createNew) {
              // TODO: we need to validate arguments prior to making this call/redirect, so that
              //   /addChainNode doesn't fail after the DAO has been created
              // https://github.com/AngelBlock/sputnik-dao-2-mockup/blob/dev/src/Selector.jsx#L159
              try {
                const account = app.user.activeAccount as NearAccount;
                const v = new BN(initialValue);
                // write addChainNode data to localstorage to call in finishNearLogin page
                localStorage[id] = JSON.stringify(addChainNodeArgs);
                // triggers a redirect
                await (app.chain as Near).chain.createDaoTx(
                  account,
                  name,
                  description,
                  v
                );
              } catch (err) {
                notifyError(err.responseJSON?.error || 'Creating DAO failed.');
                console.error(err.responseJSON?.error || err.message);
                vnode.state.saving = false;
              }
            } else {
              try {
                // verify the DAO exists
                await (app.chain as Near).chain.query(id, 'get_last_proposal_id', {});

                // POST object
                const res = await $.post(`${app.serverUrl()}/addChainNode`, addChainNodeArgs);
                await initAppState(false);
                m.route.set(`${window.location.origin}/${res.result.chain}`);
              } catch (err) {
                notifyError(err.responseJSON?.error || 'Adding DAO failed.');
                console.error(err.responseJSON?.error || err.message);
                vnode.state.saving = false;
              }
            }
          },
        }),
      ]),
    ]);
  },
};

interface CreateCommunityAttrs {}
interface CreateCommunityState {
  activeForm: string;
}

const CreateCommunity: m.Component<
  CreateCommunityAttrs,
  CreateCommunityState
> = {
  oncreate: () => {
    // mixpanel.track('New Community', {
    //   'Step No': 1,
    //   Step: 'Modal Opened',
    // });
  },
  oninit: (vnode) => {
    vnode.state.activeForm = CommunityType.OffchainCommunity;
  },
  view: (vnode: m.VnodeDOM<CreateCommunityAttrs, CreateCommunityState>) => {
    return m('div', { class: 'container CreateCommunity' }, [
      m('h3', 'New Commonwealth Community'),
      m(
        Tabs,
        {
          align: 'center',
          bordered: false,
          fluid: true,
        },
        [
          m(TabItem, {
            label: 'Offchain Community',
            active: vnode.state.activeForm === CommunityType.OffchainCommunity,
            onclick: () => {
              vnode.state.activeForm = 'offchain';
              return null;
            },
            style: 'text-align: center'
          }),
          m(TabItem, {
            label: 'ERC20',
            active: vnode.state.activeForm === CommunityType.Erc20Community,
            onclick: () => {
              vnode.state.activeForm = 'erc20';
              return null;
            },
            style: 'text-align: center'
          }),
          app.user.isSiteAdmin &&
            m(TabItem, {
              label: 'Substrate',
              active:
                vnode.state.activeForm === CommunityType.SubstrateCommunity,
              onclick: () => {
                vnode.state.activeForm = 'substrate';
                return null;
              },
              style: 'text-align: center'
            }),
          m(TabItem, {
            label: 'Sputnik (V2)',
            active: vnode.state.activeForm === 'sputnik',
            onclick: () => {
              vnode.state.activeForm = 'sputnik';
              return null;
            },
            style: 'text-align: center'
          }),
        ]
      ),
      vnode.state.activeForm === CommunityType.OffchainCommunity &&
        m(OffchainCommunityForm),
      vnode.state.activeForm === CommunityType.Erc20Community && m(ERC20Form),
      vnode.state.activeForm === CommunityType.SubstrateCommunity &&
        m(SubstrateForm),
      vnode.state.activeForm === CommunityType.SputnikDao && m(SputnikForm),
    ]);
  },
};

export default CreateCommunity;
