/* @jsx m */

import m from 'mithril';
import { Table, Button } from 'construct-ui';
import $ from 'jquery';

import 'pages/create_community_test.scss';

import app from 'state';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import {
  InputPropertyRow,
  SelectPropertyRow,
} from 'views/components/metadata_rows_test';
import { baseToNetwork } from 'views/components/login_with_wallet_dropdown';
import {
  ChainFormState,
  initChainForm,
  defaultChainRows,
} from './chain_input_rows_test';

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

export class OffchainFormTest implements m.ClassComponent<OffchainFormAttrs> {
  state: OffchainFormState;

  // constructor() {
  //   this.state.id = '';
  //   this.state.name = '';
  //   this.state.symbol = 'XYZ';
  //   this.state.base = ChainBase.Ethereum;
  //   initChainForm(this.state);
  //   this.state.saving = false;
  //   this.state.loaded = false;
  //   this.state.loading = false;
  //   this.state.status = '';
  //   this.state.error = '';
  // }

  oncreate() {
    this.state.id = '';
    this.state.name = '';
    this.state.symbol = 'XYZ';
    this.state.base = ChainBase.Ethereum;
    initChainForm(this.state);
    this.state.saving = false;
    this.state.loaded = false;
    this.state.loading = false;
    this.state.status = '';
    this.state.error = '';
  }

  view() {
    console.log(this.state);
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
            defaultValue: this.state.name,
            onChangeHandler: (v) => {
              this.state.name = v;
              this.state.id = slugify(v);
            },
          }),
          m(InputPropertyRow, {
            title: 'ID',
            defaultValue: this.state.id,
            value: this.state.id,
            onChangeHandler: (v) => {
              this.state.id = v;
            },
          }),
          m(InputPropertyRow, {
            title: 'Symbol',
            defaultValue: this.state.symbol,
            onChangeHandler: (v) => {
              this.state.symbol = v;
            },
          }),
          m(SelectPropertyRow, {
            title: 'Base Chain',
            options: ['cosmos', 'ethereum', 'near'],
            value: this.state.base,
            onchange: (value) => {
              this.state.base = value;
            },
          }),
          ...defaultChainRows(this.state),
        ]
      ),
      m(Button, {
        class: 'mt-3',
        label: 'Save changes',
        intent: 'primary',
        disabled: this.state.saving,
        onclick: async () => {
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
          } = this.state;

          this.state.saving = true;
          const additionalArgs: {
            eth_chain_id?: number;
            node_url?: string;
            bech32_prefix?: string;
          } = {};

          // defaults to be overridden when chain is no longer "offchain" type
          switch (this.state.base) {
            case ChainBase.CosmosSDK: {
              additionalArgs.node_url = 'https://rpc-osmosis.keplr.app';
              additionalArgs.bech32_prefix = 'osmo';
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
              base: this.state.base,
              network: baseToNetwork(this.state.base),
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
            this.state.saving = false;
          }
        },
      }),
    ]);
  }
}
