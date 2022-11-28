/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';
import $ from 'jquery';

import 'pages/create_community.scss';

import app from 'state';
import { ChainBase, ChainNetwork, ContractType } from 'common-common/src/types';
import { AbiItem, isAddress } from 'web3-utils';
import { notifyError } from 'controllers/app/notifications';
import { InputRow, SelectRow } from 'views/components/metadata_rows';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWValidationText } from 'views/components/component_kit/cw_validation_text';
import {
  initChainForm,
  ethChainRows,
} from '../create_community/chain_input_rows';
import {
  ChainFormFields,
  ChainFormState,
  EthChainAttrs,
  EthFormFields,
} from '../create_community/types';

type ContractFormFields = {
  abi: AbiItem[];
  chain_node_id: number;
  contractType: ContractType;
  decimals: number;
  token_name: string;
};

type CreateContractForm = ChainFormFields & EthFormFields & ContractFormFields;

type CreateContractState = ChainFormState & { form: CreateContractForm };

export class AddContractForm extends ClassComponent<EthChainAttrs> {
  private state: CreateContractState = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
    form: {
      address: '',
      chainString: 'Ethereum Mainnet',
      // For Now we hard code the chain node id until we have a better way to distinguish between chains
      chain_node_id: 37,
      name: '',
      abi: JSON.parse('[]'),
      contractType: ContractType.ERC20,
      nodeUrl: '',
      symbol: '',
      token_name: '',
      decimals: 0,
      ...initChainForm(),
    },
  };

  oninit(vnode: m.Vnode<EthChainAttrs>) {
    this.state.form.nodeUrl = vnode.attrs.ethChains[1].url;
  }

  view(vnode: m.Vnode<EthChainAttrs>) {
    const validAddress = isAddress(this.state.form.address);

    return (
      <div class="CreateCommunityForm">
        {...ethChainRows(vnode.attrs, this.state.form)}
        <InputRow
          title="Abi"
          value={this.state.form.abi.toString()}
          placeholder="Optional: Paste ABI here"
          onChangeHandler={(value) => {
            this.state.form.abi = value;
            this.state.loaded = false;
          }}
          textarea
        />
        <SelectRow
          title="Contract Type"
          options={Object.values(ContractType)}
          value={this.state.form.contractType}
          onchange={(value) => {
            this.state.form.contractType = value;
            this.state.loaded = false;
          }}
        />
        <InputRow
          title="Token Name"
          value={this.state.form.token_name}
          placeholder="Optional: Enter a token name for this contract"
          onChangeHandler={(v) => {
            this.state.form.token_name = v;
          }}
        />
        <InputRow
          title="Symbol"
          value={this.state.form.symbol}
          placeholder="Optional: Enter token symbol"
          onChangeHandler={(v) => {
            this.state.form.symbol = v;
          }}
        />
        <InputRow
          title="Decimals"
          value={this.state.form.decimals}
          placeholder="Optional: Enter Decimals"
          onChangeHandler={(v) => {
            this.state.form.decimals = v;
          }}
        />
        <CWButton
          label="Save Contract"
          disabled={
            this.state.saving ||
            !validAddress ||
            !this.state.form.chain_node_id ||
            this.state.loading
          }
          onclick={async () => {
            const {
              altWalletUrl,
              chainString,
              chain_node_id,
              nodeUrl,
              symbol,
            } = this.state.form;
            this.state.saving = true;
            try {
              const res = await $.post(`${app.serverUrl()}/createContract`, {
                alt_wallet_url: altWalletUrl,
                base: ChainBase.Ethereum,
                chain_string: chainString,
                chain_node_id,
                jwt: app.user.jwt,
                network: ChainNetwork.ERC20,
                node_url: nodeUrl,
                default_symbol: symbol,
                ...this.state.form,
              });
              if (res.status === 'Success') {
                this.state.status = 'success';
                this.state.message = `Contract with Address ${res.result.contract.address} saved successfully`;
                this.state.loading = false;
                m.redraw();
              }
            } catch (err) {
              notifyError(
                err.responseJSON?.error || 'Creating new contract failed'
              );
            } finally {
              this.state.saving = false;
            }
          }}
        />

        {this.state.message && (
          <CWValidationText
            message={this.state.message}
            status={this.state.status}
          />
        )}
      </div>
    );
  }
}
