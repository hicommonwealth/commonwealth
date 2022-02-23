import 'pages/create_community.scss';

import m from 'mithril';
import app from 'state';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import {
  InputPropertyRow,
  SelectPropertyRow,
} from 'views/components/metadata_rows';
import { baseToNetwork } from 'views/components/login_with_wallet_dropdown';
import {
  ChainFormState,
  initChainForm,
  defaultChainRows,
} from './chain_input_rows';

type OffchainFormAttrs = Record<string, unknown>;

interface OffchainFormState extends ChainFormState {
  id: string;
  name: string;
  base: ChainBase;
  saving: boolean;
  loaded: boolean;
  loading: boolean;
  status: string;
  symbol: string;
  error: string;
}

const OffchainForm: m.Component<OffchainFormAttrs, OffchainFormState> = {
  oninit: (vnode) => {
    vnode.state.id = '';
    vnode.state.name = '';
    vnode.state.symbol = 'XYZ';
    vnode.state.base = ChainBase.Ethereum;
    initChainForm(vnode.state);
    vnode.state.saving = false;
    vnode.state.loaded = false;
    vnode.state.loading = false;
    vnode.state.status = '';
    vnode.state.error = '';
  },
  view: (vnode) => {
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
            onChangeHandler: (v) => {
              vnode.state.symbol = v;
            },
          }),
          m(SelectPropertyRow, {
            title: 'Base Chain',
            options: ['cosmos','ethereum','near'],
            value: vnode.state.base,
            onchange: (value) => {
              vnode.state.base = value;
            },
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
            id,
            name,
            description,
            icon_url,
            website,
            discord,
            element,
            telegram,
            github,
            symbol,
          } = vnode.state;
          vnode.state.saving = true;
          const additionalArgs: { eth_chain_id?: number, node_url?: string, bech32_prefix?: string, alt_wallet_url?: string } = {};

          // defaults to be overridden when chain is no longer "offchain" type
          switch (vnode.state.base) {
            case ChainBase.CosmosSDK: {
              additionalArgs.node_url = 'https://rpc-osmosis.blockapsis.com';
              additionalArgs.bech32_prefix = 'osmo';
              additionalArgs.alt_wallet_url = 'https://lcd-osmosis.blockapsis.com';
              break;
            }
            case ChainBase.NEAR: {
              additionalArgs.node_url = 'https://rpc.mainnet.near.org';
              break;
            }
            case ChainBase.Solana: {
              additionalArgs.node_url = 'https://api.mainnet-beta.solana.com';
              break;
            }
            case ChainBase.Substrate: {
              additionalArgs.node_url = 'wss://mainnet.edgewa.re';
              break;
            }
            case ChainBase.Ethereum:
            default: {
              additionalArgs.eth_chain_id = 1;
              additionalArgs.node_url =
                'wss://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr';
              additionalArgs.alt_wallet_url =
                'https://eth-mainnet.alchemyapi.io/v2/cNC4XfxR7biwO2bfIO5aKcs9EMPxTQfr';
              break;
            }
          }
          try {
            const res = await $.post(`${app.serverUrl()}/createChain`, {
              address: '',
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
              type: ChainType.Offchain,
              base: vnode.state.base,
              network: baseToNetwork(vnode.state.base),
              ...additionalArgs,
            });
            await initAppState(false);
            m.route.set(`/${res.result.chain?.id}`);
          } catch (err) {
            notifyError(
              err.responseJSON?.error ||
                'Creating new offchain community failed'
            );
          } finally {
            vnode.state.saving = false;
          }
        },
      }),
    ]);
  },
};

export default OffchainForm;
