import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import BN from 'bn.js';
import $ from 'jquery';
import { initAppState } from 'app';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { NearAccount } from 'controllers/chain/near/account';
import Near from 'controllers/chain/near/main';
import { notifyError } from 'controllers/app/notifications';
import {
  InputPropertyRow,
  TogglePropertyRow,
} from 'views/components/metadata_rows';

type SputnikFormAttrs = Record<string, unknown>;

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
    return m('.sputnik-creation-form', [
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
          class: 'mt-3',
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

export default SputnikForm;