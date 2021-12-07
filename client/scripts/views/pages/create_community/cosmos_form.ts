import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import { Tendermint34Client } from '@cosmjs/tendermint-rpc';
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
  endpointError: string;
  id: string;
  name: string;
  symbol: string;
  bech32_prefix: string;
  saving: boolean;
  testing: boolean;
  height: number;
  error: string;
}

const CosmosForm: m.Component<CosmosFormAttrs, CosmosFormState> = {
  oninit: (vnode) => {
    vnode.state.url = '';
    vnode.state.id = '';
    vnode.state.name = '';
    vnode.state.symbol = '';
    vnode.state.bech32_prefix = '';
    initChainForm(vnode.state);
    vnode.state.saving = false;
    vnode.state.testing = false;
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
              title: 'Tendermint URL',
              defaultValue: vnode.state.url,
              placeholder: 'http://my-rpc.cosmos-chain.com:26657/',
              onChangeHandler: async (v) => {
                vnode.state.url = v;
              }
            }),
            m('tr', [
              m('td', { class: 'title-column', }, ''),
              m(Button, {
                label: 'Test Connection',
                disabled: true, // vnode.state.testing,
                onclick: async (e) => {
                  vnode.state.endpointError = null;
                  vnode.state.testing = true;
                  vnode.state.height = 0;
                  try {
                    const tmClient = await Tendermint34Client.connect(vnode.state.url);
                    const { block } = await tmClient.block();
                    const [chainId] = block.header.chainId.split('-');
                    vnode.state.height = block.header.height;
                    vnode.state.name = chainId;
                    vnode.state.id = slugify(chainId);
                    // TODO: populate more information if possible
                  } catch (err) {
                    vnode.state.endpointError = err.message;
                  }
                  vnode.state.testing = false;
                  m.redraw();
                },
              }),
            ]),
            vnode.state.endpointError && m('tr', [
              m('td', { class: 'title-column', }, 'Error'),
              m('td', { class: 'error-column' }, vnode.state.endpointError),
            ]),
            !!vnode.state.height && m('tr', [
              m('td', { class: 'title-column', }, 'Current Height'),
              m('td', { class: 'height-column' }, `${vnode.state.height}`),
            ]),
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
              disabled: true,
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
              notifyError(
                err.responseJSON?.error ||
                'Creating new Cosmos community failed'
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

export default CosmosForm;