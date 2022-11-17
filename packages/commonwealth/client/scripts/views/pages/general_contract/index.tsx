/* @jsx m */

import 'pages/general_contract/index.scss';
import app from 'state';
import { Contract } from 'models';
import m from 'mithril';
import { Spinner } from 'construct-ui';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { AbiItem, AbiInput, AbiOutput } from 'web3-utils/types';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { ChainBase } from 'common-common/src/types';
import { TransactionReceipt } from 'web3-core';
import { parseFunctionsFromABI } from 'helpers/abi_utils';
import GeneralContractsController from 'controllers/chain/ethereum/generalContracts';
import {
  handleMappingAbiInputs,
  processAbiInputsToDataTypes,
  validateAbiInput,
} from 'helpers/abi_form_helpers';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { ChainFormState } from '../create_community/types';

type CreateContractForm = {
  functionNameToFunctionInputArgs: Map<string, Map<number, string>>;
};

type CreateContractState = ChainFormState & {
  functionNameToFunctionOutput: Map<string, any[]>;
  form: CreateContractForm;
};
class GeneralContractPage
  implements m.ClassComponent<{ contractAddress?: string }>
{
  generalContractsController: GeneralContractsController;
  private state: CreateContractState = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
    functionNameToFunctionOutput: new Map<string, any[]>(),
    form: {
      functionNameToFunctionInputArgs: new Map<string, Map<number, string>>(),
    },
  };

  view(vnode) {
    const fetchContractAbi = async (contract: Contract) => {
      if (contract.abi === undefined) {
        // use the contract address to fetch the abi using controller
        await app.contracts.checkFetchEtherscanForAbi(contract.address);
        // TODO The UI Should In One Go show the abi form after successfully fetching the abi
        // from etherscan, which it does not do rn
        m.redraw();
      }
    };

    const callFunction = async (contractAddress: string, fn: AbiItem) => {
      const contract = app.contracts.getByAddress(contractAddress);
      this.state.loading = true;
      let tx: string | TransactionReceipt;

      try {
        const sender = app.user.activeAccount;
        // get querying wallet
        const signingWallet = await app.wallets.locateWallet(
          sender,
          ChainBase.Ethereum
        );

        // initialize daoFactory Controller
        this.generalContractsController = new GeneralContractsController(
          signingWallet.api,
          contract
        );

        // handle processing the forms inputs into their proper data types
        const processedArgs = processAbiInputsToDataTypes(
          fn.name,
          fn.inputs,
          this.state.form.functionNameToFunctionInputArgs
        );
        tx = await this.generalContractsController.callContractFunction(
          fn,
          processedArgs,
          signingWallet
        );
        console.log('tx is ', tx);

        const result = this.generalContractsController.decodeTransactionData(
          fn,
          tx,
          signingWallet
        );

        this.state.functionNameToFunctionOutput.set(fn.name, result);
        this.state.saving = false;
        this.state.loaded = true;
        this.state.loading = false;
        m.redraw();
      } catch (err) {
        notifyError(
          err.responseJSON?.error || `Calling Function ${fn.name} failed`
        );
        this.state.status = 'failure';
        this.state.message = err.message;
        this.state.loading = false;
        m.redraw();
      }
    };

    const loadContractAbi = () => {
      const { contractAddress } = vnode.attrs;
      const contract: Contract = app.contracts.getByAddress(contractAddress);
      const abiFunctions = parseFunctionsFromABI(contract.abi);
      return abiFunctions;
    };

    const { contractAddress } = vnode.attrs;

    if (app.contracts.getCommunityContracts().length > 0) {
      const contract: Contract = app.contracts.getByAddress(contractAddress);
      if (contract) {
        this.state.loaded = true;
        this.state.status = 'success';
        this.state.message = 'Contract loaded';
      }
      fetchContractAbi(contract);
    }

    if (!app.contracts || !app.chain) {
      return <PageLoading title="General Contract" />;
    } else {
      if (app.chain.base !== ChainBase.Ethereum) {
        return (
          <PageNotFound content="Contract ABI UI Generator Only Available for Ethereum based Chains" />
        );
      }
    }

    return (
      <Sublayout>
        <div class="GeneralContractPage">
          <CWText type="h4">General Contract</CWText>
          <CWText>Contract Address: {contractAddress}</CWText>
          <div class="functions-container">
            <div class="header-row">
              <CWText>Name</CWText>
              <CWText>State Mutability</CWText>
              <CWText>Inputs</CWText>
              <CWText>Outputs</CWText>
              <CWText>Call Function</CWText>
            </div>
            {loadContractAbi().map((fn: AbiItem, fnIdx: number) => {
              return (
                <div class="function-row">
                  <CWText>{fn.name}</CWText>
                  <CWText>{fn.stateMutability}</CWText>
                  <div class="functions-input-container">
                    {fn.inputs.map((input: AbiInput, inputIdx: number) => {
                      return (
                        <div>
                          <div class="function-inputs">
                            <CWText>[{inputIdx}]</CWText>
                            <CWText>{input.type}</CWText>
                            <CWText>{input.name}</CWText>
                          </div>
                          <div>
                            <CWTextInput
                              name="Contract Input Field"
                              placeholder="Insert Input Here"
                              oninput={(e) => {
                                handleMappingAbiInputs(
                                  inputIdx,
                                  e.target.value,
                                  fn.name,
                                  this.state.form
                                    .functionNameToFunctionInputArgs
                                );
                                this.state.loaded = true;
                              }}
                              inputValidationFn={(val) =>
                                validateAbiInput(val, input.type)
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div class="functions-output-container">
                    {fn.outputs.map((output: AbiOutput, i) => {
                      const fnOutputArray =
                        this.state.functionNameToFunctionOutput.get(fn.name);
                      return (
                        <div>
                          <div class="function-outputs">
                            <CWText>[{i}]</CWText>
                            <CWText>{output.type}</CWText>
                            <CWText>{output.name}</CWText>
                          </div>
                          <div>
                            {this.state.loading && <Spinner active />}
                            <CWText>
                              {fnOutputArray && fnOutputArray[i].toString()
                                ? fnOutputArray[i].toString()
                                : ''}
                            </CWText>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div class="function-call">
                    <CWButton
                      label="Submit"
                      disabled={this.state.saving || !this.state.loaded}
                      onclick={() => {
                        notifySuccess('Submit Call button clicked!');
                        this.state.saving = true;
                        try {
                          callFunction(contractAddress, fn);
                        } catch (err) {
                          notifyError(
                            err.responseJSON?.error ||
                              'Submitting Function Call failed'
                          );
                        } finally {
                          this.state.saving = false;
                        }
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default GeneralContractPage;
