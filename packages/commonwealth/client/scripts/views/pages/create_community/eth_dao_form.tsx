import React from 'react';

import { ClassComponent, setRoute, redraw } from 'mithrilInterop';
import type { ResultNode } from 'mithrilInterop';
import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { initAppState } from 'state';

import { IAaveGovernanceV2__factory } from 'common-common/src/eth/types';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';

import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';
import { notifyError } from 'controllers/app/notifications';
import AaveApi from 'controllers/chain/ethereum/aave/api';
import CompoundAPI, {
  GovernorTokenType,
  GovernorType,
} from 'controllers/chain/ethereum/compound/api';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import $ from 'jquery';

import 'pages/create_community.scss';

import app from 'state';
import { slugifyPreserveDashes } from 'utils';

import { CWButton } from 'views/components/component_kit/cw_button';
import { CWValidationText } from 'views/components/component_kit/cw_validation_text';
import { IdRow, InputRow } from 'views/components/metadata_rows';

import {
  defaultChainRows,
  ethChainRows,
  initChainForm,
} from 'views/pages/create_community/chain_input_rows';

import type {
  ChainFormFields,
  ChainFormState,
  EthChainAttrs,
  EthFormFields,
} from 'views/pages/create_community/types';
import { isAddress } from 'web3-utils';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';

type EthDaoFormFields = {
  network: ChainNetwork.Aave | ChainNetwork.Compound;
  tokenName: string;
};

type CreateEthDaoForm = ChainFormFields & EthFormFields & EthDaoFormFields;

type CreateEthDaoState = ChainFormState & { form: CreateEthDaoForm };

export class EthDaoForm extends ClassComponent<EthChainAttrs> {
  public state: CreateEthDaoState = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
    form: {
      address: '',
      chainString: 'Ethereum Mainnet',
      ethChainId: 1,
      id: '',
      name: '',
      network: ChainNetwork.Compound,
      nodeUrl: '',
      symbol: '',
      tokenName: 'token',
      ...initChainForm(),
    },
  };

  oninit(vnode: ResultNode<EthChainAttrs>) {
    this.state.form.nodeUrl = vnode.attrs.ethChains[1].url;
  }

  view(vnode: ResultNode<EthChainAttrs>) {
    const validAddress = isAddress(this.state.form.address);
    const disableField = !validAddress || !this.state.loaded;

    const updateDAO = async () => {
      if (
        !this.state.form.address ||
        !this.state.form.ethChainId ||
        !this.state.form.nodeUrl
      )
        return;
      this.state.loading = true;
      this.state.status = undefined;
      this.state.message = '';
      try {
        if (this.state.form.network === ChainNetwork.Compound) {
          const Web3 = (await import('web3')).default;
          const provider = new Web3.providers.WebsocketProvider(
            this.state.form.nodeUrl
          );
          const compoundApi = new CompoundAPI(
            null,
            this.state.form.address,
            provider
          );
          await compoundApi.init(this.state.form.tokenName);
          if (!compoundApi.Token) {
            throw new Error(
              'Could not find governance token. Is "Token Name" field valid?'
            );
          }
          const govType = GovernorType[compoundApi.govType];
          const tokenType = GovernorTokenType[compoundApi.tokenType];
          this.state.status = 'success';
          this.state.message = `Found ${govType} with token type ${tokenType}`;
        } else if (this.state.form.network === ChainNetwork.Aave) {
          const Web3 = (await import('web3')).default;
          const provider = new Web3.providers.WebsocketProvider(
            this.state.form.nodeUrl
          );
          const aaveApi = new AaveApi(
            IAaveGovernanceV2__factory.connect,
            this.state.form.address,
            provider
          );
          await aaveApi.init();
          this.state.status = 'success';
          this.state.message = `Found Aave type DAO`;
        } else {
          throw new Error('invalid chain network');
        }
      } catch (e) {
        this.state.status = 'failure';
        this.state.message = e.message;
        this.state.loading = false;
        redraw();
        return;
      }
      this.state.loaded = true;
      this.state.loading = false;
      redraw();
    };

    return (
      <div className="CreateCommunityForm">
        {...ethChainRows(vnode.attrs, this.state.form)}
        <CWDropdown
          label="DAO Type"
          options={[
            { label: ChainNetwork.Aave, value: ChainNetwork.Aave },
            { label: ChainNetwork.Compound, value: ChainNetwork.Compound },
          ]}
          onSelect={(o) => {
            this.state.form.network = o.value as
              | ChainNetwork.Aave
              | ChainNetwork.Compound;
            this.state.loaded = false;
          }}
        />
        {this.state.form.network === ChainNetwork.Compound && (
          <InputRow
            title="Token Name (Case Sensitive)"
            value={this.state.form.tokenName}
            onChangeHandler={(v) => {
              this.state.form.tokenName = v;
              this.state.loaded = false;
            }}
          />
        )}
        <CWButton
          label="Test contract"
          disabled={
            this.state.saving ||
            !validAddress ||
            !this.state.form.ethChainId ||
            this.state.loading
          }
          onClick={async () => {
            await updateDAO();
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
        {...defaultChainRows(this.state.form, disableField)}
        <CWButton
          label="Save changes"
          disabled={this.state.saving || !validAddress || !this.state.loaded}
          onClick={async () => {
            const {
              chainString,
              ethChainId,
              nodeUrl,
              tokenName,
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
                base: ChainBase.Ethereum,
                chain_string: chainString,
                eth_chain_id: ethChainId,
                jwt: app.user.jwt,
                node_url: nodeUrl,
                icon_url: iconUrl,
                token_name: tokenName,
                type: ChainType.DAO,
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
              // TODO: notify about needing to run event migration
              setRoute(`/${res.result.chain?.id}`);
            } catch (err) {
              notifyError(
                err.responseJSON?.error ||
                  'Creating new ETH DAO community failed'
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
