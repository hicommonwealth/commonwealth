/* @jsx m */

import m from 'mithril';
import $ from 'jquery';
import Web3 from 'web3';

import 'pages/create_community.scss';

import app from 'state';
import { initAppState } from 'app';
import { slugifyPreserveDashes } from 'utils';
import { ChainBase, ChainNetwork, ChainType } from 'common-common/src/types';
import { isAddress } from 'web3-utils';

import { notifyError } from 'controllers/app/notifications';
import { IdRow, InputRow, SelectRow } from 'views/components/metadata_rows';

import { CWButton } from 'views/components/component_kit/cw_button';
import { CWValidationText } from 'views/components/component_kit/cw_validation_text';

import {
  initChainForm,
  defaultChainRows,
  ethChainRows,
} from 'views/pages/create_community/chain_input_rows';

import {
  ChainFormState,
  EthChainAttrs,
  EthFormFields,
} from 'views/pages/create_community/types';

import { Contract } from 'client/scripts/models';
import { Network } from '../../../helpers/types';
import { parseFunctionsFromABI, getEtherscanABI } from '../../../helpers/abi_utils'

type GenerateABIUIState = EthFormFields;

type CreateAbiUIState = ChainFormState & { form: GenerateABIUIState };

export class GenerateUIFromABIForm implements m.ClassComponent<EthChainAttrs> {
  private state: CreateAbiUIState = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
    form: {
      address: '',
    },
  };

  oninit(vnode) {
    this.state.form.nodeUrl = vnode.attrs.ethChains[1].url;
  }

  view(vnode) {
    const validAddress = isAddress(this.state.form.address);
    const disableField = !validAddress || !this.state.loaded;

    const generateUI = async () => {
      if (
        !this.state.form.address
      )
        return;
      this.state.loading = true;
      this.state.status = undefined;
      this.state.message = '';
      try {
        console.log("generateui")
        const contractAddr = this.state.form.address;
        console.log(contractAddr)
        const contract: Contract = app.contracts.store.getContractByAddress(contractAddr);
        console.log(contract);
        const network = Network.Mainnet;
        console.log("Network: ", network)
        const etherscanAbi = await getEtherscanABI(network, contractAddr);
        console.log("Etherscan Abi", etherscanAbi);
        console.log(parseFunctionsFromABI(etherscanAbi));
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
        <CWButton
          label="Test contract"
          disabled={
            this.state.saving ||
            !validAddress ||
            this.state.loading
          }
          onclick={async () => {
            await generateUI();
          }}
        />
      </div>
    );
  }
}
