import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainType } from 'types';
import {
  InputPropertyRow
} from 'views/components/metadata_rows';
import { ChainFormState, initChainForm, defaultChainRows } from './chain_input_rows';

//
// TODO: populate additional fields
//

type CosmosFormAttrs = Record<string, unknown>;

interface CosmosFormState extends ChainFormState {
  url: string;
  id: string;
  name: string;
  symbol: string;
  bech32_prefix: string;
  decimals: string;
  alt_wallet_url: string;
  saving: boolean;
  error: string;
}

const CosmosForm: m.Component<CosmosFormAttrs, CosmosFormState> = {
  oninit: (vnode) => {
    vnode.state.url = '';
    vnode.state.id = '';
    vnode.state.name = '';
    vnode.state.symbol = '';
    vnode.state.bech32_prefix = '';
    vnode.state.alt_wallet_url = '';
    initChainForm(vnode.state);
    vnode.state.saving = false;
    vnode.state.error = '';
  },
  view: (vnode) => {
    return m('.cosmos-creation-form', [
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
              title: 'RPC URL',
              defaultValue: vnode.state.url,
              placeholder: 'http://my-rpc.cosmos-chain.com:26657/',
              onChangeHandler: async (v) => {
                vnode.state.url = v;
              }
            }),
            m(InputPropertyRow, {
              title: 'Name',
              defaultValue: vnode.state.name,
              onChangeHandler: (v) => {
                vnode.state.name = v;
                vnode.state.id = slugify(v);
              },
            }),
            m(InputPropertyRow, {
              title: 'ID',
              defaultValue: vnode.state.id,
              value: vnode.state.id,
              onChangeHandler: (v) => {
                vnode.state.id = v;
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
              title: 'Bech32 Prefix',
              defaultValue: vnode.state.bech32_prefix,
              placeholder: 'cosmos',
              onChangeHandler: async (v) => {
                vnode.state.bech32_prefix = v;
              }
            }),
            // TODO: validate this as number
            m(InputPropertyRow, {
              title: 'Decimals',
              defaultValue: vnode.state.decimals,
              placeholder: '6',
              onChangeHandler: async (v) => {
                vnode.state.decimals = v;
              }
            }),
            // TODO: add alt wallet URL field
            ...defaultChainRows(vnode.state),
          ]
        ),
        m(Button, {
          class: 'mt-3',
          label: 'Save changes',
          intent: 'primary',
          disabled: vnode.state.saving,
          onclick: async (e) => {
            const {
              url,
              id,
              name,
              description,
              symbol,
              bech32_prefix,
              decimals,
              icon_url,
              website,
              discord,
              element,
              telegram,
              github,
            } = vnode.state;
            vnode.state.saving = true;
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                node_url: url,
                id,
                name,
                description,
                symbol,
                bech32_prefix,
                decimals,
                icon_url,
                website,
                discord,
                element,
                telegram,
                github,
                jwt: app.user.jwt,
                type: ChainType.Chain,
                base: ChainBase.CosmosSDK,
                network: id,
              });
              await initAppState(false);
              m.route.set(`/${res.result.chain?.id}`);
            } catch (err) {
              vnode.state.error = err.responseJSON?.error || 'Creating new Cosmos community failed';
            } finally {
              vnode.state.saving = false;
              m.redraw();
            }
          },
        }),
        vnode.state.error && m('tr', [
          m('td', { class: 'title-column', }, 'Error'),
          m('td', { class: 'error-column' }, vnode.state.error),
        ]),
      ]),
    ]);
  },
};

export default CosmosForm;