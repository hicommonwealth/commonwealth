/* @jsx m */

import m from 'mithril';
import $ from 'jquery';

import 'pages/create_community.scss';

import app from 'state';
import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { initAppState } from 'app';
import { slugifyPreserveDashes } from 'utils';
import { ChainBase, ChainType } from 'common-common/src/types';
import { initChainForm, defaultChainRows } from './chain_input_rows';
import { ChainFormFields, ChainFormState, EthFormFields } from './types';
import { IdRow, InputRow } from '../../components/metadata_rows';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';

// TODO: populate additional fields

type CosmosFormFields = {
  bech32Prefix: string;
  decimals: number;
};

type CreateCosmosForm = ChainFormFields & EthFormFields & CosmosFormFields;

type CreateCosmosState = ChainFormState & { form: CreateCosmosForm };

export class CosmosForm implements m.ClassComponent {
  private state: CreateCosmosState = {
    message: '',
    saving: false,
    form: {
      altWalletUrl: '',
      bech32Prefix: '',
      decimals: 6,
      id: '',
      name: '',
      symbol: 'XYZ',
      nodeUrl: '',
      ...initChainForm(),
    },
  };

  view() {
    return (
      <div class="CreateCommunityForm">
        <InputRow
          title="RPC URL"
          defaultValue={this.state.form.nodeUrl}
          placeholder="http://my-rpc.cosmos-chain.com:26657/"
          onChangeHandler={async (v) => {
            this.state.form.nodeUrl = v;
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
        <IdRow id={this.state.form.id} />
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
          defaultValue={this.state.form.bech32Prefix}
          placeholder="cosmos"
          onChangeHandler={async (v) => {
            this.state.form.bech32Prefix = v;
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
          disabled={this.state.saving}
          onclick={async () => {
            const {
              altWalletUrl,
              bech32Prefix,
              chainString,
              ethChainId,
              nodeUrl,
            } = this.state.form;
            this.state.saving = true;
            mixpanelBrowserTrack({
              event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_ATTEMPTED,
              chainBase: null,
              isCustomDomain: app.isCustomDomain(),
              communityType: null,
            });
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                alt_wallet_url: altWalletUrl,
                base: ChainBase.CosmosSDK,
                bech32_prefix: bech32Prefix,
                chain_string: chainString,
                eth_chain_id: ethChainId,
                jwt: app.user.jwt,
                network: this.state.form.id,
                node_url: nodeUrl,
                type: ChainType.Chain,
                ...this.state.form,
              });
              await initAppState(false);
              m.route.set(`/${res.result.chain?.id}`);
            } catch (err) {
              this.state.message =
                err.responseJSON?.error ||
                'Creating new Cosmos community failed';
            } finally {
              this.state.saving = false;
              m.redraw();
            }
          }}
        />
        {this.state.message && (
          <CWValidationText message={this.state.message} status="failure" />
        )}
      </div>
    );
  }
}
