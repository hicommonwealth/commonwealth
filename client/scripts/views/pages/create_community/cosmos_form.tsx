/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'pages/create_community_test.scss';

import app from 'state';
import { initAppState } from 'app';
import { slugifyPreserveDashes } from 'utils';
import { ChainBase, ChainType } from 'types';
import { initChainForm, defaultChainRows } from './chain_input_rows';
import { ChainFormFields, ChainFormState, EthFormFields } from './types';
import { InputRow } from '../../components/metadata_rows';
import { CWButton } from '../../components/component_kit/cw_button';

// TODO: populate additional fields

type CosmosFormFields = {
  bech32_prefix: string;
  decimals: number;
};

type CreateCosmosForm = ChainFormFields & EthFormFields & CosmosFormFields;

type CreateCosmosState = ChainFormState & { form: CreateCosmosForm };

export class CosmosForm implements m.ClassComponent {
  private state: CreateCosmosState = {
    error: '',
    saving: false,
    form: {
      alt_wallet_url: '',
      bech32_prefix: '',
      decimals: 6,
      id: '',
      name: '',
      symbol: 'XYZ',
      node_url: '',
      ...initChainForm(),
    },
  };

  view() {
    return (
      <div class="CreateCommunityForm">
        <InputRow
          title="RPC URL"
          defaultValue={this.state.form.node_url}
          placeholder="http://my-rpc.cosmos-chain.com:26657/"
          onChangeHandler={async (v) => {
            this.state.form.node_url = v;
          }}
        />
        <InputRow
          title="Name"
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
          placeholder="XYZ"
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        <InputRow
          title="Bech32 Prefix"
          defaultValue={this.state.form.bech32_prefix}
          placeholder="cosmos"
          onChangeHandler={async (v) => {
            this.state.form.bech32_prefix = v;
          }}
        />
        <InputRow
          title="Decimals"
          defaultValue={`${this.state.form.decimals}`}
          disabled={true}
          onChangeHandler={(v) => {
            this.state.form.decimals = +v;
          }}
        />
        {/* TODO: add alt wallet URL field */}
        {...defaultChainRows(this.state.form)}
        <CWButton
          label="Save changes"
          buttonType="primary"
          disabled={this.state.saving}
          onclick={async () => {
            this.state.saving = true;
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                jwt: app.user.jwt,
                type: ChainType.Chain,
                base: ChainBase.CosmosSDK,
                network: this.state.form.id,
                ...this.state.form,
              });
              await initAppState(false);
              m.route.set(`/${res.result.chain?.id}`);
            } catch (err) {
              this.state.error =
                err.responseJSON?.error ||
                'Creating new Cosmos community failed';
            } finally {
              this.state.saving = false;
              m.redraw();
            }
          }}
        />
        <div class="validation-container">
          {this.state.error && <div class="error">{this.state.error}</div>}
        </div>
      </div>
    );
  }
}
