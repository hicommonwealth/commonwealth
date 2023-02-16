import React from 'react';

// import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { initAppState } from 'state';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { notifyError } from 'controllers/app/notifications';
// import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';

import { ClassComponent } from 'mithrilInterop';
import $ from 'jquery';
import type { ConnectConfig } from 'near-api-js';
import { connect as nearConnect, keyStores } from 'near-api-js';
import type { CodeResult } from 'near-api-js/lib/providers/provider';

import 'pages/create_community.scss';

import app from 'state';
import { InputRow, ToggleRow } from 'views/components/metadata_rows';
import { CommunityType } from '.';

import { linkExistingAddressToChainOrCommunity } from '../../../controllers/app/login';
import { CWButton } from '../../components/component_kit/cw_button';

import { defaultChainRows, initChainForm } from './chain_input_rows';
import type { ChainFormFields, ChainFormState } from './types';
import withRouter from 'navigation/helpers';

type CreateSputnikForm = ChainFormFields & { isMainnet: boolean };

type CreateSputnikState = ChainFormState & { form: CreateSputnikForm };

class SputnikFormComponent extends ClassComponent {
  public state: CreateSputnikState = {
    saving: false,
    form: {
      name: '',
      isMainnet: true,
      ...initChainForm(),
    },
  };

  view() {
    return (
      <div className="CreateCommunityForm">
        <InputRow
          title="DAO Name"
          value={this.state.form.name}
          onChangeHandler={(v) => {
            this.state.form.name = v.toLowerCase();
          }}
          placeholder="genesis"
        />
        <ToggleRow
          title="Network"
          defaultValue={this.state.form.isMainnet}
          onToggle={(checked) => {
            this.state.form.isMainnet = checked;
            mixpanelBrowserTrack({
              event: MixpanelCommunityCreationEvent.CHAIN_SELECTED,
              chainBase: ChainBase.CosmosSDK,
              isCustomDomain: app.isCustomDomain(),
              communityType: CommunityType.SputnikDao,
            });
          }}
          caption={(checked) => {
            if (checked !== this.state.form.isMainnet) {
              return 'Unknown network!';
            }
            return checked ? 'Mainnet' : 'Testnet';
          }}
        />
        {/* TODO: add divider to distinguish on-chain data */}
        {defaultChainRows(this.state.form)}
        <CWButton
          label="Save changes"
          disabled={this.state.saving}
          onClick={async () => {
            const { iconUrl, name } = this.state.form;

            this.state.saving = true;

            const isMainnet = this.state.form.isMainnet;

            // slice name if has sputnik-dao or sputnikv2 appened or keep name if otherwise
            const daoName = name.includes('sputnik-dao')
              ? name.slice(0, name.indexOf('sputnik-dao') - 1)
              : name.includes('sputnikv2')
              ? name.slice(0, name.indexOf('sputnikv2') - 1)
              : name;

            const id = isMainnet
              ? `${daoName}.sputnik-dao.near`
              : `${daoName}.sputnikv2.testnet`;

            const url = isMainnet
              ? 'https://rpc.mainnet.near.org'
              : 'https://rpc.testnet.near.org';

            const createChainArgs = {
              base: ChainBase.NEAR,
              icon_url: iconUrl,
              id,
              jwt: app.user.jwt,
              name: id,
              network: ChainNetwork.Sputnik,
              node_url: url,
              default_symbol: isMainnet ? 'NEAR' : 'tNEAR',
              type: ChainType.DAO,
              ...this.state.form,
            };
            // mixpanelBrowserTrack({
            //   event: MixpanelCommunityCreationEvent.CREATE_COMMUNITY_ATTEMPTED,
            //   chainBase: null,
            //   isCustomDomain: app.isCustomDomain(),
            //   communityType: null,
            // });

            try {
              // verify the DAO exists
              const config: ConnectConfig = {
                networkId: isMainnet ? 'mainnet' : 'testnet',
                nodeUrl: url,
                keyStore: new keyStores.BrowserLocalStorageKeyStore(
                  localStorage
                ),
              };
              const api = await nearConnect(config);

              const rawResult = await api.connection.provider.query<CodeResult>(
                {
                  request_type: 'call_function',
                  account_id: id,
                  method_name: 'get_last_proposal_id',
                  args_base64: Buffer.from(JSON.stringify({})).toString(
                    'base64'
                  ),
                  finality: 'optimistic',
                }
              );
              const _validResponse = JSON.parse(
                Buffer.from(rawResult.result).toString()
              );

              // POST object
              const res = await $.post(
                `${app.serverUrl()}/createChain`,
                createChainArgs
              );
              if (res.result.admin_address) {
                await linkExistingAddressToChainOrCommunity(
                  res.result.admin_address,
                  res.result.role.chain_id,
                  res.result.role.chain_id
                );
              }
              await initAppState(false);
              this.setRoute(`${window.location.origin}/${res.result.chain.id}`);
            } catch (err) {
              notifyError(err.responseJSON?.error || 'Adding DAO failed.');
              console.error(err.responseJSON?.error || err.message);
              this.state.saving = false;
            }
          }}
        />
      </div>
    );
  }
}

export const SputnikForm = withRouter(SputnikFormComponent);
