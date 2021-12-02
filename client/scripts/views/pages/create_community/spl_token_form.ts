import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import * as solw3 from '@solana/web3.js';
import { notifyError } from 'controllers/app/notifications';
import {
  InputPropertyRow, SelectPropertyRow
} from 'views/components/metadata_rows';
import { ChainFormState, initChainForm, defaultChainRows } from './chain_input_rows';

type SplTokenFormAttrs = Record<string, unknown>;

interface SplTokenFormState extends ChainFormState {
  cluster: solw3.Cluster;
  mint: string;
  mintPubKey: solw3.PublicKey;
  id: string;
  name: string;
  symbol: string;
  decimals: number;
  saving: boolean;
  loaded: boolean;
  loading: boolean;
  status: string;
  error: string;
}

const SplTokenForm: m.Component<SplTokenFormAttrs, SplTokenFormState> = {
  oninit: (vnode) => {
    vnode.state.cluster = 'mainnet-beta';
    vnode.state.mint = '';
    vnode.state.id = '';
    vnode.state.name = '';
    vnode.state.symbol = '';
    vnode.state.decimals = 6;
    initChainForm(vnode.state);
    vnode.state.saving = false;
    vnode.state.loaded = false;
    vnode.state.loading = false;
    vnode.state.status = '';
    vnode.state.error = '';
  },
  view: (vnode) => {
    const disableField = !vnode.state.loaded;

    const updateTokenForum = async () => {
      vnode.state.status = '';
      vnode.state.error = '';
      let mintPubKey: solw3.PublicKey;
      try {
        mintPubKey = new solw3.PublicKey(vnode.state.mint);
      } catch (e) {
        vnode.state.error = 'Invalid mint address';
        return false;
      }
      if (!mintPubKey) return;
      vnode.state.loading = true;
      try {
        const url = solw3.clusterApiUrl(vnode.state.cluster);
        const connection = new solw3.Connection(url, 'confirmed');
        const supply = await connection.getTokenSupply(mintPubKey);
        const { decimals, amount } = supply.value;
        vnode.state.decimals = decimals;
        vnode.state.loaded = true;
        vnode.state.status = `Found ${amount} supply!`;
      } catch (err) {
        vnode.state.error = `Error: ${err.message}` || 'Failed to load token';
      }
      vnode.state.loading = false;
      m.redraw();
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
          m(SelectPropertyRow, {
            title: 'Cluster',
            options: ['mainnet-beta', 'testnet', 'devnet'],
            value: vnode.state.cluster,
            onchange: (value) => {
              vnode.state.cluster = value;
              vnode.state.loaded = false;
            },
          }),
          m(InputPropertyRow, {
            title: 'Mint Address',
            defaultValue: vnode.state.mint,
            placeholder: '2sgDUTgTP6e9CrJtexGdba7qZZajVVHf9TiaCtS9Hp3P',
            onChangeHandler: (v) => {
              vnode.state.mint = v.trim();
              vnode.state.loaded = false;
            },
          }),
          m('tr', [
            m('td', { class: 'title-column', }, ''),
            m(Button, {
              label: 'Check address',
              intent: 'primary',
              disabled: vnode.state.saving || vnode.state.loading,
              onclick: async (e) => {
                await updateTokenForum();
              },
            }),
          ]),
          vnode.state.error && m('tr', [
            m('td', { class: 'title-column', }, 'Error'),
            m('td', { class: 'error-column' }, vnode.state.error),
          ]),
          vnode.state.status && m('tr', [
            m('td', { class: 'title-column', }, 'Test Status'),
            m('td', { class: 'status-column' }, `${vnode.state.status}`),
          ]),
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
            title: 'Decimals',
            defaultValue: `${vnode.state.decimals}`,
            disabled: true,
            onChangeHandler: (v) => {
              vnode.state.decimals = +v;
            },
          }),
          ...defaultChainRows(vnode.state, disableField),
        ]
      ),
      m(Button, {
        class: 'mt-3',
        label: 'Save changes',
        intent: 'primary',
        disabled: vnode.state.saving || !vnode.state.loaded,
        onclick: async (e) => {
          const {
            mint,
            cluster,
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
            decimals,
          } = vnode.state;
          vnode.state.saving = true;
          try {
            const res = await $.post(`${app.serverUrl()}/createChain`, {
              address: mint,
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
              decimals,
              jwt: app.user.jwt,
              type: ChainType.Token,
              base: ChainBase.Solana,
              network: ChainNetwork.SPL,
              node_url: cluster,
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

export default SplTokenForm;