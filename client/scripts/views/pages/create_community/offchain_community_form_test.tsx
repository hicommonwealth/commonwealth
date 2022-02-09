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

interface OffchainFormStateAttributes extends ChainFormState {
  id: string;
  name: string;
  base: ChainBase;
  saving: boolean;
  loaded: boolean;
  loading: boolean;
  symbol: string;
  error: string;
}

const OffchainFormState: OffchainFormStateAttributes = {
  id: '',
  name: '',
  base: ChainBase.Ethereum,
  saving: false,
  loaded: false,
  loading: false,
  symbol: 'XYZ',
  error: '',
  description: '',
  icon_url: '',
  website: '',
  discord: '',
  element: '',
  telegram: '',
  github: '',
  uploadInProgress: false
}

export class OffchainFormTest implements m.ClassComponent<OffchainFormAttrs> {
  view(vnode) {
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
            defaultValue: OffchainFormState.name,
            onChangeHandler: (v) => {
              OffchainFormState.name = v;
              OffchainFormState.id = slugify(v);
            },
          }),
          m(InputPropertyRow, {
            title: 'ID',
            defaultValue: OffchainFormState.id,
            value: OffchainFormState.id,
            onChangeHandler: (v) => {
              OffchainFormState.id = v;
            },
          }),
          m(InputPropertyRow, {
            title: 'Symbol',
            defaultValue: OffchainFormState.symbol,
            onChangeHandler: (v) => {
              OffchainFormState.symbol = v;
            },
          }),
          m(SelectPropertyRow, {
            title: 'Base Chain',
            options: ['cosmos', 'ethereum', 'near'],
            value: OffchainFormState.base,
            onchange: (value) => {
              OffchainFormState.base = value;
            },
          }),
          ...defaultChainRows(this),
        ]
      ),
      m(Button, {
        class: 'mt-3',
        label: 'Save changes',
        intent: 'primary',
        disabled: OffchainFormState.saving,
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
          } = OffchainFormState;

          OffchainFormState.saving = true;
          const additionalArgs: {
            eth_chain_id?: number;
            node_url?: string;
            bech32_prefix?: string;
          } = {};

          // defaults to be overridden when chain is no longer "offchain" type
          switch (OffchainFormState.base) {
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
              base: OffchainFormState.base,
              network: baseToNetwork(OffchainFormState.base),
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
            OffchainFormState.saving = false;
          }
        },
      }),
    ]);
  }
}
