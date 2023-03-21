/* @jsx m */

import 'pages/general_contract/index.scss';
import app from 'state';
import type { Contract } from 'models';
import m from 'mithril';
import ClassComponent from 'class_component';

import { notifyError, notifySuccess } from 'controllers/app/notifications';
import type { AbiItem, AbiInput, AbiOutput } from 'web3-utils/types';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { ChainBase } from 'common-common/src/types';
import { parseFunctionsFromABI } from 'abi_utils';
import { callContractFunction } from 'controllers/chain/ethereum/callContractFunction';
import {
  handleMappingAbiInputs,
  validateAbiInput,
} from 'helpers/abi_form_helpers';
import { CWSpinner } from 'views/components/component_kit/cw_spinner';
import type { Result } from 'ethers/lib/utils';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { ethers } from 'ethers';

class GeneralContractPage extends ClassComponent<{ contractAddress?: string }> {
  private loaded = false;
  private loading = false;
  private saving = false;
  private functionNameToFunctionOutput = new Map<string, Result>();
  private form = {
    functionNameToFunctionInputArgs: new Map<string, Map<number, string>>(),
  };

  view(vnode: m.Vnode<{ contractAddress?: string }>) {
    const fetchContractAbi = async (contract: Contract) => {
      if (contract.abi === undefined) {
        try {
          // use the contract address to fetch the abi using controller
          await app.contracts.checkFetchEtherscanForAbi(contract.address);
          // TODO The UI Should In One Go show the abi form after successfully fetching the abi
          // from etherscan, which it does not do rn
          m.redraw();
        } catch (err) {
          notifyError(
            err.message || `Fetching ABI for ${contract.address} failed: ${err}`
          );
        }
      }
    };

    const callFunction = async (contractAddress: string, fn: AbiItem) => {
      try {
        this.loading = true;
        const contract = app.contracts.getByAddress(contractAddress);
        if (!contract) {
          throw new Error('Contract not found');
        }

        // Convert map of number to string to array of string
        const inputArgs = this.form.functionNameToFunctionInputArgs.get(
          fn.name
        );
        const inputArgsArray = [];
        if (inputArgs && inputArgs.size > 0) {
          for (let i = 0; i < inputArgs.size; i++) {
            inputArgsArray.push(inputArgs.get(i));
          }
        }

        const result = await callContractFunction({
          contract,
          fn,
          inputArgs: inputArgsArray,
        });

        const ethersInterface = new ethers.utils.Interface(contract.abi);
        this.functionNameToFunctionOutput.set(
          fn.name,
          ethersInterface.decodeFunctionResult(fn.name, result)
        );
        this.saving = false;
        this.loaded = true;
        this.loading = false;
      } catch (err) {
        notifyError(err.message || `Calling Function ${fn.name} failed`);
        this.loading = false;
      }
    };

    const loadContractAbi = (): AbiItem[] => {
      const { contractAddress } = vnode.attrs;
      const contract: Contract = app.contracts.getByAddress(contractAddress);
      if (!contract || !contract.abi) {
        // TODO: show screen for "no ABI found" -- or fetch data
        return [];
      }
      const abiFunctions = parseFunctionsFromABI(contract.abi);
      return abiFunctions;
    };

    const { contractAddress } = vnode.attrs;

    if (app.contracts.getCommunityContracts().length > 0) {
      const contract: Contract = app.contracts.getByAddress(contractAddress);
      if (contract) {
        this.loaded = true;
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
            {loadContractAbi().map((fn: AbiItem) => {
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
                                  this.form.functionNameToFunctionInputArgs
                                );
                                this.loaded = true;
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
                        this.functionNameToFunctionOutput.get(fn.name);
                      return (
                        <div>
                          <div class="function-outputs">
                            <CWText>[{i}]</CWText>
                            <CWText>{output.type}</CWText>
                            <CWText>{output.name}</CWText>
                          </div>
                          <div>
                            {this.loading && <CWSpinner />}
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
                      disabled={this.saving || !this.loaded}
                      onclick={() => {
                        notifySuccess('Submit Call button clicked!');
                        this.saving = true;
                        try {
                          callFunction(contractAddress, fn);
                        } catch (err) {
                          notifyError(
                            err.message || 'Submitting Function Call failed'
                          );
                        } finally {
                          this.saving = false;
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
