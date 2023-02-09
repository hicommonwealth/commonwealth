import React from 'react';

import type * as solanaWeb3 from '@solana/web3.js';
import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { initAppState } from 'state';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  } from 'mithrilInterop';
import $ from 'jquery';

import app from 'state';
import { slugifyPreserveDashes } from 'utils';
import { IdRow, InputRow } from 'views/components/metadata_rows';

import { linkExistingAddressToChainOrCommunity } from '../../../controllers/app/login';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { CWValidationText } from '../../components/component_kit/cw_validation_text';
import { defaultChainRows, initChainForm } from './chain_input_rows';
import type { ChainFormFields, ChainFormState } from './types';

type SplTokenFormFields = {
  cluster: solanaWeb3.Cluster;
  decimals: number;
  mint: string;
};

type CreateERC20Form = ChainFormFields & SplTokenFormFields;

type CreateSplTokenState = ChainFormState & { form: CreateERC20Form };

export class SplTokenForm extends ClassComponent {
  public state: CreateSplTokenState = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
    form: {
      cluster: 'mainnet-beta',
      decimals: 6,
      id: '',
      mint: '',
      name: '',
      symbol: '',
      ...initChainForm(),
    },
  };

  view() {
    const disableField = !this.state.loaded;

    const updateTokenForum = async () => {
      this.state.status = undefined;
      this.state.message = '';
      let mintPubKey: solanaWeb3.PublicKey;
      const solw3 = await import('@solana/web3.js');
      try {
        mintPubKey = new solw3.PublicKey(this.state.form.mint);
      } catch (e) {
        this.state.status = 'failure';
        this.state.message = 'Invalid mint address';
        return false;
      }
      if (!mintPubKey) return;
      this.state.loading = true;
      try {
        const url = solw3.clusterApiUrl(this.state.form.cluster);
        const connection = new solw3.Connection(url);
        const supply = await connection.getTokenSupply(mintPubKey);
        const { decimals, amount } = supply.value;
        this.state.form.decimals = decimals;
        this.state.loaded = true;
        this.state.status = 'success';
        this.state.message = `Found ${amount} supply!`;
      } catch (err) {
        this.state.status = 'failure';
        this.state.message = `Error: ${err.message}` || 'Failed to load token';
      }
      this.state.loading = false;
      redraw();
    };

    return (
      <div className="CreateCommunityForm">
        <CWDropdown
          label="Cluster"
          options={[
            { label: 'mainnet-beta', value: 'mainnet-beta' },
            { label: 'testnet', value: 'testnet' },
            { label: 'devnet', value: 'devnet' },
          ]}
          onSelect={(o) => {
            this.state.form.cluster = o.value as solanaWeb3.Cluster;
            this.state.loaded = false;
          }}
        />
        <InputRow
          title="Mint Address"
          value={this.state.form.mint}
          placeholder="2sgDUTgTP6e9CrJtexGdba7qZZajVVHf9TiaCtS9Hp3P"
          onChangeHandler={(v) => {
            this.state.form.mint = v.trim();
            this.state.loaded = false;
          }}
        />
        <CWButton
          label="Check address"
          disabled={this.state.saving || this.state.loading}
          onClick={async () => {
            await updateTokenForum();
          }}
        />
        {this.state.message && (
          <CWValidationText
            message={this.state.message}
            status={this.state.status}
          />
        )}
        <InputRow
          title="Name"
          value={this.state.form.name}
          disabled={disableField}
          onChangeHandler={(v) => {
            this.state.form.name = v;
            this.state.form.id = slugifyPreserveDashes(v);
          }}
        />
        <IdRow id={this.state.form.id} />
        <InputRow
          title="Symbol"
          disabled={disableField}
          value={this.state.form.symbol}
          placeholder="XYZ"
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
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
        {...defaultChainRows(this.state.form, disableField)}
        <CWButton
          label="Save changes"
          disabled={this.state.saving || !this.state.loaded}
          onClick={async () => {
            const { cluster, iconUrl, mint, symbol } = this.state.form;
            this.state.saving = true;
            mixpanelBrowserTrack({
              event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_ATTEMPTED,
              chainBase: null,
              isCustomDomain: app.isCustomDomain(),
              communityType: null,
            });
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                address: mint,
                base: ChainBase.Solana,
                icon_url: iconUrl,
                jwt: app.user.jwt,
                network: ChainNetwork.SPL,
                node_url: cluster,
                type: ChainType.Token,
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
              notifyError(
                err.responseJSON?.error || 'Creating new SPL community failed'
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
