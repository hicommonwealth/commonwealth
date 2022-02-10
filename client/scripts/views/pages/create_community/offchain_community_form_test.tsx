/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'pages/create_community_test.scss';

import app from 'state';
import { initAppState } from 'app';
import { slugifyPreserveDashes } from 'utils';
import { ChainBase, ChainType } from 'types';
import { notifyError } from 'controllers/app/notifications';
import { InputRow, SelectRow } from 'views/components/metadata_rows_test';
import { baseToNetwork } from 'views/components/login_with_wallet_dropdown';
import {
  initChainForm,
  defaultChainRows,
  ChainFormState,
} from './chain_input_rows_test';
import { CWButton } from '../../components/component_kit/cw_button';

// TODO: ChainFormState contains "uploadInProgress" which is technically
// not part of the form (what we pass to /createChain), but of the general view's state,
// and should be located elsewhere.
type CreateOffchainForm = {
  base: ChainBase;
  id: string;
  name: string;
  symbol: string;
} & ChainFormState;

type CreateOffchainState = {
  error: string;
  form: CreateOffchainForm;
  loaded: boolean;
  loading: boolean;
  saving: boolean;
  status: string;
};

export class OffchainFormTest implements m.ClassComponent {
  private state: CreateOffchainState = {
    error: '',
    loaded: false,
    loading: false,
    saving: false,
    status: '',
    form: {
      id: '',
      name: '',
      symbol: 'XYZ',
      base: ChainBase.Ethereum,
      ...initChainForm(),
    },
  };

  view() {
    return (
      <div class="CreateCommunityForm">
        <InputRow
          title="Name"
          placeholder="Enter the name of your community"
          defaultValue={this.state.form.name}
          onChangeHandler={(v) => {
            this.state.form.name = v;
            this.state.form.id = slugifyPreserveDashes(v);
          }}
        />
        <div class="IDRow">
          <label>ID</label>
          <div class={`id ${!this.state.form.id.length && 'placeholder'}`}>
            {!this.state.form.id.length
              ? 'ID will show up here based on your name'
              : this.state.form.id}
          </div>
        </div>
        <InputRow
          title="Symbol"
          defaultValue={this.state.form.symbol}
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        <SelectRow
          title="Base Chain"
          options={['cosmos', 'ethereum', 'near']}
          value={this.state.form.base}
          onchange={(value) => {
            this.state.form.base = value;
          }}
        />
        {...defaultChainRows(this.state.form)}
        <CWButton
          class="mt-3"
          label="Save changes"
          buttonType="primary"
          disabled={this.state.saving}
          onclick={async () => {
            this.state.saving = true;
            const additionalArgs: {
              eth_chain_id?: number;
              node_url?: string;
              bech32_prefix?: string;
            } = {};

            // defaults to be overridden when chain is no longer "offchain" type
            switch (this.state.form.base) {
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
                jwt: app.user.jwt,
                address: '',
                type: ChainType.Offchain,
                network: baseToNetwork(this.state.form.base),
                ...this.state.form,
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
