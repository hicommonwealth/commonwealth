import React from 'react';

import { ClassComponent, setRoute, redraw} from

 'mithrilInterop';
import $ from 'jquery';
import m from 'mithril';

import 'pages/create_community.scss';
import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { initAppState } from 'state';
import { ChainBase, ChainType } from 'common-common/src/types';
import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import app from 'state';
import { slugifyPreserveDashes } from 'utils';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { IdRow, InputRow } from '../../components/metadata_rows';
import { defaultChainRows, initChainForm } from './chain_input_rows';
import type { ChainFormFields, ChainFormState, EthFormFields } from './types';

// TODO: populate additional fields

type CosmosFormFields = {
  bech32Prefix: string;
  decimals: number;
};

type CreateCosmosForm = ChainFormFields & EthFormFields & CosmosFormFields;

type CreateCosmosState = ChainFormState & { form: CreateCosmosForm };

export class CosmosForm extends ClassComponent {
  public state: CreateCosmosState = {
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
      <div className="CreateCommunityForm">
        <InputRow
          title="RPC URL"
          value={this.state.form.nodeUrl}
          placeholder="http://my-rpc.cosmos-chain.com:26657/"
          onChangeHandler={async (v) => {
            this.state.form.nodeUrl = v;
          }}
        />
        <InputRow
          title="Name"
          value={this.state.form.name}
          onChangeHandler={(v) => {
            this.state.form.name = v;
            this.state.form.id = slugifyPreserveDashes(v);
          }}
        />
        <IdRow id={this.state.form.id} />
        <InputRow
          title="Symbol"
          value={this.state.form.symbol}
          placeholder="XYZ"
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        <InputRow
          title="Bech32 Prefix"
          value={this.state.form.bech32Prefix}
          placeholder="cosmos"
          onChangeHandler={async (v) => {
            this.state.form.bech32Prefix = v;
          }}
        />
        <InputRow
          title="Decimals"
          value={`${this.state.form.decimals}`}
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
          onClick={async () => {
            const {
              altWalletUrl,
              bech32Prefix,
              chainString,
              ethChainId,
              nodeUrl,
              symbol,
              iconUrl,
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
                icon_url: iconUrl,
                type: ChainType.Chain,
                default_symbol: symbol,
                ...this.state.form,
              });
              if (res.result.admin_address) {
                await linkExistingAddressToChainOrCommunity(
                  res.result.admin_address,
                  res.result.role.chain_id,
                  res.result.role.chain_id
                );
              }
              await initAppState(false);
              setRoute(`/${res.result.chain?.id}`);
            } catch (err) {
              this.state.message =
                err.responseJSON?.error ||
                'Creating new Cosmos community failed';
            } finally {
              this.state.saving = false;
              redraw();
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
