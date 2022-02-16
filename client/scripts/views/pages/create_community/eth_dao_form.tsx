/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import Web3 from 'web3';

import 'pages/create_community_test.scss';

import app from 'state';
import { initAppState } from 'app';
import { slugifyPreserveDashes } from 'utils';
import { ChainBase, ChainNetwork, ChainType } from 'types';
import { isAddress } from 'web3-utils';

import { IAaveGovernanceV2__factory } from 'eth/types';
import { notifyError } from 'controllers/app/notifications';
import { InputRow, SelectRow } from 'views/components/metadata_rows';
import CompoundAPI, {
  GovernorTokenType,
  GovernorType,
} from 'controllers/chain/ethereum/compound/api';
import AaveApi from 'controllers/chain/ethereum/aave/api';
import {
  initChainForm,
  defaultChainRows,
  ethChainRows,
} from './chain_input_rows';
import {
  ChainFormFields,
  ChainFormState,
  EthChainAttrs,
  EthFormFields,
} from './types';
import { CWButton } from '../../components/component_kit/cw_button';

type EthDaoFormFields = {
  network: ChainNetwork.Aave | ChainNetwork.Compound;
  token_name: string;
};

type CreateEthDaoForm = ChainFormFields & EthFormFields & EthDaoFormFields;

type CreateEthDaoState = ChainFormState & { form: CreateEthDaoForm };

export class EthDaoForm implements m.ClassComponent<EthChainAttrs> {
  private state: CreateEthDaoState = {
    error: '',
    loaded: false,
    loading: false,
    saving: false,
    status: '',
    form: {
      address: '',
      chain_string: 'Ethereum Mainnet',
      eth_chain_id: 1,
      id: '',
      name: '',
      network: ChainNetwork.Compound,
      node_url: '',
      symbol: '',
      token_name: 'token',
      ...initChainForm(),
    },
  };

  oninit(vnode) {
    this.state.form.node_url = vnode.attrs.ethChains[1].url;
  }

  view(vnode) {
    const validAddress = isAddress(this.state.form.address);
    const disableField = !validAddress || !this.state.loaded;

    const updateDAO = async () => {
      if (
        !this.state.form.address ||
        !this.state.form.eth_chain_id ||
        !this.state.form.node_url
      )
        return;
      this.state.loading = true;
      this.state.status = '';
      this.state.error = '';
      try {
        if (this.state.form.network === ChainNetwork.Compound) {
          const provider = new Web3.providers.WebsocketProvider(
            this.state.form.node_url
          );
          const compoundApi = new CompoundAPI(
            null,
            this.state.form.address,
            provider
          );
          await compoundApi.init(this.state.form.token_name);
          if (!compoundApi.Token) {
            throw new Error(
              'Could not find governance token. Is "Token Name" field valid?'
            );
          }
          const govType = GovernorType[compoundApi.govType];
          const tokenType = GovernorTokenType[compoundApi.tokenType];
          this.state.status = `Found ${govType} with token type ${tokenType}`;
        } else if (this.state.form.network === ChainNetwork.Aave) {
          const provider = new Web3.providers.WebsocketProvider(
            this.state.form.node_url
          );
          const aaveApi = new AaveApi(
            IAaveGovernanceV2__factory.connect,
            this.state.form.address,
            provider
          );
          await aaveApi.init();
          this.state.status = `Found Aave type DAO`;
        } else {
          throw new Error('invalid chain network');
        }
      } catch (e) {
        this.state.error = e.message;
        this.state.loading = false;
        m.redraw();
        return;
      }
      this.state.loaded = true;
      this.state.loading = false;
      m.redraw();
    };

    return (
      <div class="CreateCommunityForm">
        {...ethChainRows(vnode.attrs, this.state)}
        <SelectRow
          title="DAO Type"
          options={[ChainNetwork.Aave, ChainNetwork.Compound]}
          value={this.state.form.network}
          onchange={(value) => {
            this.state.form.network = value;
            this.state.loaded = false;
          }}
        />
        {this.state.form.network === ChainNetwork.Compound && (
          <InputRow
            title="Token Name (Case Sensitive)"
            defaultValue={this.state.form.token_name}
            onChangeHandler={(v) => {
              this.state.form.token_name = v;
              this.state.loaded = false;
            }}
          />
        )}
        <CWButton
          label="Test contract"
          buttonType="primary"
          disabled={
            this.state.saving ||
            !validAddress ||
            !this.state.form.eth_chain_id ||
            this.state.loading
          }
          onclick={async () => {
            await updateDAO();
          }}
        />
        <div class="validation-container">
          {this.state.error && <div class="error">{this.state.error}</div>}
          {this.state.status && <div class="status">{this.state.status}</div>}
        </div>
        <InputRow
          title="Name"
          defaultValue={this.state.form.name}
          disabled={disableField}
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
          disabled={disableField}
          defaultValue={this.state.form.symbol}
          placeholder="XYZ"
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        {...defaultChainRows(this.state.form, disableField)}
        <CWButton
          label="Save changes"
          buttonType="primary"
          disabled={this.state.saving || !validAddress || !this.state.loaded}
          onclick={async () => {
            this.state.saving = true;
            try {
              const res = await $.post(`${app.serverUrl()}/createChain`, {
                jwt: app.user.jwt,
                type: ChainType.DAO,
                base: ChainBase.Ethereum,
                network: this.state.form.network,
                ...this.state.form,
              });
              await initAppState(false);
              // TODO: notify about needing to run event migration
              m.route.set(`/${res.result.chain?.id}`);
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
