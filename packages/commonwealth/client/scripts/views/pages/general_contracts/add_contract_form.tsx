/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import Web3 from 'web3';

import 'pages/create_community.scss';

import app from 'state';
import { MixpanelCommunityCreationEvent } from 'analytics/types';
import { mixpanelBrowserTrack } from 'helpers/mixpanel_browser_util';
import { initAppState } from 'app';
import { slugifyPreserveDashes } from 'utils';
import { ChainBase, ChainNetwork, ChainType, ContractType } from 'common-common/src/types';
import { isAddress } from 'web3-utils';

import { notifyError } from 'controllers/app/notifications';
import { IdRow, InputRow, SelectRow } from 'views/components/metadata_rows';
import CompoundAPI, {
  GovernorTokenType,
  GovernorType,
} from 'controllers/chain/ethereum/compound/api';
import AaveApi from 'controllers/chain/ethereum/aave/api';

import { CWButton } from 'views/components/component_kit/cw_button';
import { CWValidationText } from 'views/components/component_kit/cw_validation_text';

import { linkExistingAddressToChainOrCommunity } from 'controllers/app/login';

import {
    initChainForm,
    defaultChainRows,
    ethChainRows,
} from '../create_community/chain_input_rows';

import {
ChainFormFields,
ChainFormState,
EthChainAttrs,
EthFormFields,
} from '../create_community/types';

type ContractFormFields = {
  abi: JSON,
  contractType: ContractType.DaoFactory | ContractType.Aave |ContractType.Compound |
  ContractType.ERC20 | ContractType.ERC721 | ContractType.SPL;
  tokenName: string;
};

type CreateContractForm = ChainFormFields & EthFormFields & ContractFormFields;

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
      ethChainId: 1,
      id: '',
      name: '',
      abi: JSON.parse('[]'),
      contractType: ContractType.DaoFactory,
      nodeUrl: '',
      symbol: '',
      tokenName: 'token',
      ...initChainForm(),
    },
  };

  oninit(vnode) {
    this.state.form.nodeUrl = vnode.attrs.ethChains[1].url;
  }

  view(vnode) {
    const validAddress = isAddress(this.state.form.address);
    const disableField = !validAddress || !this.state.loaded;

    const generateABIUI = async () => {
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
        this.state.status = 'success';
      } catch (e) {
        this.state.status = 'failure';
        this.state.message = e.message;
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
        {...ethChainRows(vnode.attrs, this.state.form)}
        <InputRow
          title="Abi"
          value={this.state.form.abi}
          placeholder="Optional: Paste ABI here"
          onChangeHandler={(value) => {
            this.state.form.abi = value;
            this.state.loaded = false;
          }}
        />,
        <SelectRow
          title="Contract Type"
          options={[
            ContractType.DaoFactory, ContractType.ERC20,
            ContractType.ERC721, ContractType.SPL,
            ContractType.Aave, ContractType.Compound
          ]}
          value={this.state.form.contractType}
          onchange={(value) => {
            this.state.form.contractType = value;
            this.state.loaded = false;
          }}
        />
        <InputRow
          title="Name"
          value={this.state.form.name}
          placeholder="Optional: Enter a name for this contract"
          onChangeHandler={(v) => {
            this.state.form.name = v;
            this.state.form.id = slugifyPreserveDashes(v);
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
        <CWButton
          label="Save Contract"
          disabled={
            this.state.saving ||
            !validAddress ||
            !this.state.form.ethChainId ||
            this.state.loading
          }
          onclick={async () => {
            const { altWalletUrl, chainString, ethChainId, nodeUrl, symbol } =
              this.state.form;
            this.state.saving = true;
            try {
              const res = await $.post(`${app.serverUrl()}/createContract`, {
                alt_wallet_url: altWalletUrl,
                base: ChainBase.Ethereum,
                chain_string: chainString,
                eth_chain_id: ethChainId,
                jwt: app.user.jwt,
                network: ChainNetwork.ERC20,
                node_url: nodeUrl,
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
              // await initAppState(false);
              // m.route.set(`/${res.result.chain?.id}`);
            } catch (err) {
              notifyError(
                err.responseJSON?.error || 'Creating new ERC20 community failed'
              );
            } finally {
              this.state.saving = false;
            }
          }}
        />

        <CWButton
          label="Generate UI for ABI"
          disabled={
            this.state.saving ||
            !validAddress ||
            !this.state.form.ethChainId ||
            this.state.loading
          }
          onclick={async () => {
            await generateABIUI();
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
