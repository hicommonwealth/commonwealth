/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'pages/create_community_test.scss';

import app from 'state';
import { initAppState } from 'app';
import { slugify } from 'utils';
import { ChainBase, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import { InputRow, SelectRow } from 'views/components/metadata_rows_test';
import { baseToNetwork } from 'views/components/login_with_wallet_dropdown';
import {
  initChainForm,
  defaultChainRows,
} from './chain_input_rows_test';
import { CWButton } from '../../components/component_kit/cw_button';

export class OffchainFormTest implements m.ClassComponent {
  private state = {
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
  }
  oninit() { console.log('offchain form init'); }
  oncreate() { console.log('offchain form create'); }
  view() {
    console.log(this.state);
    return (
      <div class="CreateCommunityForm">
        <InputRow
          title="Name"
          placeholder="Enter the name of your community"
          defaultValue={this.state.name}
          onChangeHandler={(v) => {
            this.state.name = v;
            this.state.id = slugify(v);
          }}
        />
        <InputRow
          title="ID"
          placeholder="ID will show up here based on your name"
          defaultValue={this.state.id}
          value={this.state.id}
          onChangeHandler={(v) => {
            this.state.id = v;
          }}
        />
        <InputRow
          title="Symbol"
          defaultValue={this.state.symbol}
          onChangeHandler={(v) => {
            this.state.symbol = v;
          }}
        />
        <SelectRow
          title="Base Chain"
          options={['cosmos', 'ethereum', 'near']}
          value={this.state.base}
          onchange={(value) => {
            this.state.base = value;
          }}
        />
        {...defaultChainRows(this.state)}
        <CWButton
          class="mt-3"
          label="Save changes"
          buttonType="primary"
          disabled={this.state.saving}
          onclick={async () => {
            console.log(this.state);
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
          }}
        />
      </div>
    );
  }
}
