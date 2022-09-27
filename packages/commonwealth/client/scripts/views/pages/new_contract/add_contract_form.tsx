/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import Web3 from 'web3';

import 'pages/create_community.scss';

import app from 'state';
import {
  ChainBase,
  ChainNetwork,
  ChainType,
  ContractType,
} from 'common-common/src/types';
import { isAddress } from 'web3-utils';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { IdRow, InputRow, SelectRow } from 'views/components/metadata_rows';

import { CWButton } from 'views/components/component_kit/cw_button';
import { CWValidationText } from 'views/components/component_kit/cw_validation_text';

import {
  initChainForm,
  defaultChainRows,
  ethChainRows,
} from '../create_community/chain_input_rows';

import {
  ChainFormIdFields,
  ChainFormState,
  EthChainAttrs,
  EthFormFields,
} from '../create_community/types';

type ContractFormFields = {
  eth_chain_id: number;
  abi: JSON;
  contractType:
    | ContractType.Aave
    | ContractType.Compound
    | ContractType.ERC20
    | ContractType.ERC721
    | ContractType.SPL;
  decimals: number;
  token_name: string;
};

type CreateContractForm = ChainFormIdFields &
  EthFormFields &
  ContractFormFields;

type CreateContractState = ChainFormState & { form: CreateContractForm };

export class AddContractForm implements m.ClassComponent<EthChainAttrs> {
  private state: CreateContractState = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
    form: {
      address: '',
      chainString: 'Ethereum Mainnet',
      eth_chain_id: 1,
      name: '',
      abi: JSON.parse('[]'),
      contractType: ContractType.ERC20,
      nodeUrl: '',
      symbol: '',
      token_name: '',
      decimals: 0,
    },
  };

  oninit(vnode) {
    this.state.form.nodeUrl = vnode.attrs.ethChains[1].url;
  }

  view(vnode) {
    const validAddress = isAddress(this.state.form.address);

    return (
      <div class="CreateCommunityForm">
        {...ethChainRows(vnode.attrs, this.state.form)}
        <InputRow
          title="Abi"
          value={this.state.form.abi}
          placeholder="Optional: Paste ABI here"
          onChangeHandler={(value) => {
            this.state.form.abi = value;
            this.state.loaded = false;
          }}
          textarea
        />
        <SelectRow
          title="Contract Type"
          options={[
            ContractType.ERC20,
            ContractType.ERC721,
            ContractType.SPL,
            ContractType.Aave,
            ContractType.Compound,
          ]}
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
            !this.state.form.eth_chain_id ||
            this.state.loading
          }
          onclick={async () => {
            const { eth_chain_id, nodeUrl } =
              this.state.form;
            this.state.saving = true;
            try {
              const res = await app.contracts.add(
                app.activeChainId(),
                ChainBase.Ethereum,
                eth_chain_id,
                nodeUrl,
                this.state.form.address,
                this.state.form.abi,
                this.state.form.contractType,
                this.state.form.symbol,
                this.state.form.token_name,
                this.state.form.decimals
              );
              notifySuccess(`Contract ${res.address} for Community ${app.activeChainId()} created successfully!`);
            } catch (err) {
              notifyError(
                err.responseJSON?.error || 'Creating new contract with community failed'
              );
            } finally {
              this.state.saving = false;
              m.redraw();
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
