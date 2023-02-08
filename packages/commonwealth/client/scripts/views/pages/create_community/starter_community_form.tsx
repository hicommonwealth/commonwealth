/* @jsx jsx */
import React from 'react';

import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { initAppState } from 'state';
import { ChainBase, ChainType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';

import { ClassComponent, jsx } from 'mithrilInterop';
import $ from 'jquery';

import 'pages/create_community.scss';

import app from 'state';
import { slugifyPreserveDashes } from 'utils';
import { IdRow, InputRow } from 'views/components/metadata_rows';
import { CommunityType } from '.';

import { linkExistingAddressToChainOrCommunity } from '../../../controllers/app/login';
import { baseToNetwork } from '../../../helpers';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';
import { defaultChainRows, initChainForm } from './chain_input_rows';
import type { ChainFormFields, ChainFormState } from './types';
import withRouter from 'navigation/helpers';

// TODO: ChainFormState contains "uploadInProgress" which is technically
// not part of the form what we pass to /createChain, but of the general view's state,
// and should be located elsewhere.
type CreateStarterForm = ChainFormFields & { base: ChainBase };

type CreateStarterState = ChainFormState & { form: CreateStarterForm };

class StarterCommunityFormComponent extends ClassComponent {
  public state: CreateStarterState = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
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
      <div className="CreateCommunityForm">
        <InputRow
          title="Name"
          placeholder="Enter the name of your community"
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
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        <CWDropdown
          label="Base Chain"
          options={[
            { label: 'cosmos', value: 'cosmos' },
            { label: 'ethereum', value: 'ethereum' },
            { label: 'near', value: 'near' },
          ]}
          onSelect={(o) => {
            this.state.form.base = o.value as ChainBase;
            mixpanelBrowserTrack({
              event: MixpanelCommunityCreationEvent.CHAIN_SELECTED,
              chainBase: o.value,
              isCustomDomain: app.isCustomDomain(),
              communityType: CommunityType.StarterCommunity,
            });
          }}
        />
        {...defaultChainRows(this.state.form)}
        <CWButton
          label="Save changes"
          disabled={this.state.saving || this.state.form.id.length < 1}
          onClick={async () => {
            this.state.saving = true;
            const additionalArgs: {
              eth_chain_id?: number;
              node_url?: string;
              bech32_prefix?: string;
              alt_wallet_url?: string;
            } = {};
            mixpanelBrowserTrack({
              event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_ATTEMPTED,
              chainBase: this.state.form.base,
              isCustomDomain: app.isCustomDomain(),
              communityType: CommunityType.StarterCommunity,
            });

            // defaults to be overridden when chain is no longer "starter" type
            switch (this.state.form.base) {
              case ChainBase.CosmosSDK: {
                additionalArgs.node_url = 'https://rpc-osmosis.blockapsis.com';
                additionalArgs.bech32_prefix = 'osmo';
                additionalArgs.alt_wallet_url =
                  'https://lcd-osmosis.blockapsis.com';
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
                  'wss://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_';
                additionalArgs.alt_wallet_url =
                  'https://eth-mainnet.alchemyapi.io/v2/BCNLWCaGqaXwCDHlZymPy3HpjXSxK7j_';
                break;
              }
            }
            const {
              id,
              name,
              symbol,
              iconUrl,
              description,
              website,
              discord,
              telegram,
              github,
              element,
              base,
            } = this.state.form;
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                jwt: app.user.jwt,
                address: '',
                type: ChainType.Offchain,
                network: baseToNetwork(this.state.form.base),
                icon_url: iconUrl,
                id,
                name,
                default_symbol: symbol,
                base,
                description,
                discord,
                element,
                github,
                telegram,
                website,
                ...additionalArgs,
              });
              if (res.result.admin_address) {
                await linkExistingAddressToChainOrCommunity(
                  res.result.admin_address,
                  res.result.role.chain_id,
                  res.result.role.chain_id
                );
              }
              await initAppState(false);
              this.setRoute(`/${res.result.chain?.id}`);
            } catch (err) {
              console.log(err);
              notifyError(
                err.responseJSON?.error ||
                  'Creating new starter community failed'
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

export const StarterCommunityForm = withRouter(StarterCommunityFormComponent);
