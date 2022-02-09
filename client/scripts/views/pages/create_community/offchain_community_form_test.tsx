/* @jsx m */

import m from 'mithril';
import { Table } from 'construct-ui';
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
import { CWButton } from '../../components/component_kit/cw_button';

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

const initState: OffchainFormState = {
  id: '',
  name: '',
  symbol: 'XYZ',
  base: ChainBase.Ethereum,
  saving: false,
  loaded: false,
  loading: false,
  status: '',
  error: '',
  ...initChainForm(),
};

export class OffchainFormTest implements m.ClassComponent {
  view() {
    return (
      <div class="CommunityMetadataManagementTable">
        <Table
          bordered={false}
          interactive={false}
          striped={false}
          class="metadata-management-table"
        >
          <InputPropertyRow
            title="Name"
            defaultValue={initState.name}
            onChangeHandler={(v) => {
              initState.name = v;
              initState.id = slugify(v);
            }}
          />
          <InputPropertyRow
            title="ID"
            defaultValue={initState.id}
            value={initState.id}
            onChangeHandler={(v) => {
              initState.id = v;
            }}
          />
          <InputPropertyRow
            title="Symbol"
            defaultValue={initState.symbol}
            onChangeHandler={(v) => {
              initState.symbol = v;
            }}
          />
          <SelectPropertyRow
            title="Base Chain"
            options={['cosmos', 'ethereum', 'near']}
            value={initState.base}
            onchange={(value) => {
              initState.base = value;
            }}
          />
        </Table>
        {...defaultChainRows(initState)}
        <CWButton
          class="mt-3"
          label="Save changes"
          buttonType="primary"
          disabled={initState.saving}
          onclick={async () => {
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
            } = initState;

            initState.saving = true;
            const additionalArgs: {
              eth_chain_id?: number;
              node_url?: string;
              bech32_prefix?: string;
            } = {};

            // defaults to be overridden when chain is no longer "offchain" type
            switch (initState.base) {
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
                base: initState.base,
                network: baseToNetwork(initState.base),
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
              initState.saving = false;
            }
          }}
        />
      </div>
    );
  }
}
