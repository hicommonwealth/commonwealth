import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { isAddress } from 'web3-utils';
import { notifyError } from 'controllers/app/notifications';
import {
  InputPropertyRow
} from 'views/components/metadata_rows';
import { ChainFormState, initChainForm, defaultChainRows } from './chain_input_rows';

type ERC20FormAttrs = Record<string, unknown>;

interface ERC20FormState extends ChainFormState {
  chain_id: string;
  url: string;
  address: string;
  id: string;
  name: string;
  symbol: string;
  saving: boolean;
  loaded: boolean;
  error: string;
}

const ERC20Form: m.Component<ERC20FormAttrs, ERC20FormState> = {
  oninit: (vnode) => {
    vnode.state.chain_id = '1';
    vnode.state.url = '';
    vnode.state.address = '';
    vnode.state.id = '';
    vnode.state.name = '';
    vnode.state.symbol = '';
    initChainForm(vnode.state);
    vnode.state.saving = false;
    vnode.state.loaded = false;
    vnode.state.error = '';
  },
  view: (vnode) => {
    const validAddress = isAddress(vnode.state.address);
    const disableField = !validAddress || !vnode.state.loaded;

    const updateTokenForum = async () => {
      if (!vnode.state.address || !vnode.state.chain_id) return;
      const args = {
        address: vnode.state.address,
        chain_id: vnode.state.chain_id,
        allowUncached: true,
      };
      if (vnode.state.url) {
        args['url'] = vnode.state.url;
      }
      try {
        const res = await $.get(`${app.serverUrl()}/getTokenForum`, args);
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

    return m('.CommunityMetadataManagementTable', [
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
            }
          }),
          m(InputPropertyRow, {
            title: 'Websocket URL',
            defaultValue: vnode.state.url,
            placeholder: 'wss://... (leave empty for default)',
            onChangeHandler: async (v) => {
              vnode.state.url = v;
              vnode.state.loaded = false;
            }
          }),
          m(InputPropertyRow, {
            title: 'Address',
            defaultValue: vnode.state.address,
            placeholder: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
            onChangeHandler: (v) => {
              vnode.state.address = v;
              vnode.state.loaded = false;
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
          ...defaultChainRows(vnode.state, disableField),
        ]
      ),
      m(Button, {
        label: 'Test fields',
        intent: 'primary',
        disabled: vnode.state.saving || !validAddress || !vnode.state.chain_id,
        onclick: async (e) => {
          await updateTokenForum();
        },
      }),
      m(Button, {
        class: 'mt-3',
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
    ]);
  },
};

export default ERC20Form;