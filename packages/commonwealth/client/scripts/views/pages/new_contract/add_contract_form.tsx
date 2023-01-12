/* @jsx m */

import m from 'mithril';
import ClassComponent from 'class_component';

import 'pages/create_community.scss';

import app from 'state';
import { BalanceType, ContractType } from 'common-common/src/types';
import { AbiItem, isAddress } from 'web3-utils';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { IdRow, InputRow } from 'views/components/metadata_rows';

import { CWButton } from 'views/components/component_kit/cw_button';
import { CWValidationText } from 'views/components/component_kit/cw_validation_text';

import { ethChainRows } from '../create_community/chain_input_rows';

import { EthChainAttrs } from '../create_community/types';
import { CWDropdown } from '../../components/component_kit/cw_dropdown';

export class AddContractForm extends ClassComponent<EthChainAttrs> {
  private message = '';
  private loaded = false;
  private loading = false;
  private saving = false;
  private status = undefined;
  private form = {
    address: '',
    chainString: 'Ethereum Mainnet',
    // For Now we hard code the chain node id until we have a better way to distinguish between chains
    chain_node_id: 37,
    name: '',
    abiNickname: '',
    abi: '',
    contractNickname: '',
    contractType: ContractType.ERC20,
    nodeUrl: '',
    symbol: '',
    token_name: '',
    decimals: 0,
  };

  oninit(vnode: m.Vnode<EthChainAttrs>) {
    this.form.nodeUrl = vnode.attrs.ethChains[1].url;
  }

  view(vnode: m.Vnode<EthChainAttrs>) {
    const validAddress = isAddress(this.form.address);
    let validAbiNickname;
    if (this.form.abi.length > 0) {
      validAbiNickname = this.form.abiNickname.length > 0;
    } else {
      validAbiNickname = true;
    }

    return (
      <div class="CreateCommunityForm">
        {...ethChainRows(vnode.attrs, this.form)}
        <InputRow
          title="Contract Nickname"
          value={this.form.contractNickname}
          placeholder="Optional: Enter a nickname for this contract"
          onChangeHandler={(v) => {
            this.form.contractNickname = v;
          }}
        />
        <CWDropdown
          label="Contract Type"
          options={Object.values(ContractType).map((type) => {
            return { label: type, value: type };
          })}
          initialValue={{
            value: this.form.contractType,
            label: this.form.contractType,
          }}
          onSelect={(o) => {
            this.form.contractType = ContractType[o.value];
            this.loaded = false;
          }}
        />
        <InputRow
          title="Abi Nickname"
          value={this.form.abiNickname}
          placeholder="Required: Enter a nickname for this abi"
          onChangeHandler={(v) => {
            this.form.abiNickname = v;
          }}
        />
        <InputRow
          title="Abi"
          value={this.form.abi}
          placeholder="Optional: Paste ABI here"
          onChangeHandler={(value) => {
            this.form.abi = value;
            this.loaded = false;
          }}
          textarea
        />
        <InputRow
          title="Token Name"
          value={this.form.token_name}
          placeholder="Optional: Enter a token name for this contract"
          onChangeHandler={(v) => {
            this.form.token_name = v;
          }}
        />
        <InputRow
          title="Symbol"
          value={this.form.symbol}
          placeholder="Optional: Enter token symbol"
          onChangeHandler={(v) => {
            this.form.symbol = v;
          }}
        />
        <InputRow
          title="Decimals"
          value={this.form.decimals}
          placeholder="Optional: Enter Decimals"
          onChangeHandler={(v) => {
            this.form.decimals = v;
          }}
        />
        <CWButton
          label="Save Contract"
          disabled={
            this.saving ||
            !validAddress ||
            !validAbiNickname ||
            !this.form.chain_node_id ||
            this.loading
          }
          onclick={async () => {
            const {
              address,
              abi,
              contractType,
              chain_node_id,
              nodeUrl,
              symbol,
              token_name,
              decimals,
              contractNickname,
              abiNickname,
            } = this.form;
            this.saving = true;
            try {
              const res = await app.contracts.add({
                community: app.activeChainId(),
                balance_type: BalanceType.Ethereum,
                chain_node_id,
                node_url: nodeUrl,
                address,
                abi: abi !== '' ? abi : undefined,
                contractType,
                symbol,
                token_name,
                decimals,
                nickname: contractNickname,
                abiNickname: abiNickname !== '' ? abiNickname : undefined,
              });
              if (res) {
                this.status = 'success';
                this.message = `Contract with Address ${res.address} saved successfully`;
                this.loading = false;
                m.redraw();
              }
            } catch (err) {
              notifyError(
                err.responseJSON?.error ||
                  `Creating new contract with community ${app.activeChainId()} failed`
              );
            } finally {
              this.saving = false;
              m.redraw();
            }
          }}
        />
        {this.message && (
          <CWValidationText message={this.message} status={this.status} />
        )}
      </div>
    );
  }
}
