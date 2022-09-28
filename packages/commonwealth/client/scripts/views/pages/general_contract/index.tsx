/* @jsx m */

import 'pages/general_contract/index.scss';
import app from 'state';
import { Contract } from 'models';
import m from 'mithril';
import EthereumChain from 'controllers/chain/ethereum/chain';
import Ethereum from 'controllers/chain/ethereum/main';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { BigNumber, ethers } from 'ethers';
import { AbiItem, AbiInput, AbiOutput } from 'web3-utils/types';
import { Contract as Web3Contract } from 'web3-eth-contract';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { ValidationStatus } from 'views/components/component_kit/cw_validation_text';
import { ChainBase } from 'common-common/src/types';
import Web3 from 'web3';
import {
  parseAbiItemsFromABI,
  parseFunctionsFromABI,
  getEtherscanABI,
} from 'helpers/abi_utils';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { ChainFormState } from '../create_community/types';

type CreateContractForm = {
  functionNameToEthToSend: Map<string, string>;
  functionNameToFunctionInputArgs: Map<string, Map<number, string>>;
};

type CreateContractState = ChainFormState & {
  functionNameToFunctionOutput: Map<string, any[]>;
  form: CreateContractForm;
};
class GeneralContractPage
  implements m.ClassComponent<{ contractAddress?: string }>
{
  private state: CreateContractState = {
    message: '',
    loaded: false,
    loading: false,
    saving: false,
    status: undefined,
    functionNameToFunctionOutput: new Map<string, any[]>(),
    form: {
      functionNameToEthToSend: new Map<string, string>(),
      functionNameToFunctionInputArgs: new Map<string, Map<number, string>>(),
    },
  };

  loadAbiFromEtherscan = async (contractAddress: string): Promise<JSON> => {
    try {
      return await getEtherscanABI('mainnet', contractAddress);
    } catch (error) {
      console.log(error);
    }
  };

  async oninit(vnode) {
    const { contractAddress } = vnode.attrs;
    const contract: Contract =
      app.contracts.store.getContractByAddress(contractAddress);
    if (contract.abi === undefined || contract.abi === '') {
      this.loadAbiFromEtherscan(contract.address).then((abi) => {
        // Populate Abi Table
        app.contracts.addContractAbi(contract, abi);
      });
    }
    this.state.loaded = true;
  }

  view(vnode) {
    const getWeb3 = async (): Promise<Web3> => {
      // Initialize Chain
      const ethChain = app.chain.chain as EthereumChain;

      const currChain = app.chain;
      const currNode = currChain.meta.ChainNode;
      const web3Api = await ethChain.initApi(currNode);
      return web3Api;
    };

    const getWeb3Contract = async (): Promise<Web3Contract> => {
      const { contractAddress } = vnode.attrs;
      const contract: Contract =
        app.contracts.store.getContractByAddress(contractAddress);
      // Initialize Chain and Create contract instance
      const web3Api = await getWeb3();
      const web3Contract: Web3Contract = new web3Api.eth.Contract(
        parseAbiItemsFromABI(contract.abi),
        contractAddress
      );
      return web3Contract;
    };

    const callFunction = async (contractAddress: string, fn: AbiItem) => {
      if (fn.type === 'fallback') {
        console.log('fallback');
        return;
      }

      // handle array and int types
      const processedArgs = fn.inputs.map((arg: AbiInput, index: number) => {
        const type = arg.type;
        if (type.substring(0, 4) === 'uint')
          return BigNumber.from(
            this.state.form.functionNameToFunctionInputArgs
              .get(fn.name)
              .get(index)
          );
        if (type.slice(-2) === '[]')
          return JSON.parse(
            this.state.form.functionNameToFunctionInputArgs
              .get(fn.name)
              .get(index)
          );
        return this.state.form.functionNameToFunctionInputArgs
          .get(fn.name)
          .get(index);
      });

      const functionContract = await getWeb3Contract();

      // 5. Build function tx
      // Assumption is using this methodology for calling functions
      // https://web3js.readthedocs.io/en/v1.2.11/web3-eth-contract.html#id26

      const sender = app.user.activeAccount;
      // get querying wallet
      const signingWallet = await app.wallets.locateWallet(
        sender,
        ChainBase.Ethereum
      );

      // get chain
      const chain = (app.chain as Ethereum).chain;

      const web3Api = await getWeb3();
      let tx: string;

      const methodSignature = `${fn.name}(${fn.inputs
        .map((input) => input.type)
        .join(',')})`;

      const functionTx = functionContract.methods[methodSignature](
        ...processedArgs
      );

      if (fn.stateMutability === 'payable') {
        // Get value to send
        let value = '';
        if (this.state.form.functionNameToEthToSend.get(fn.name) !== undefined) {
          value = ethers.utils.parseEther(this.state.form.functionNameToEthToSend.get(fn.name)).toString();
        }
        // Sign Tx with PK if not view function
        tx = await chain.makeContractTx(
          signingWallet,
          contractAddress,
          functionTx.encodeABI(),
          value
        );
      }
      else if (fn.stateMutability !== 'view' && fn.constant !== true) {
        // Sign Tx with PK if not view function
        tx = await chain.makeContractTx(
          signingWallet,
          contractAddress,
          functionTx.encodeABI()
        );
      } else {
        // send transaction
        tx = await chain.makeContractCall(
          signingWallet,
          contractAddress,
          functionTx.encodeABI(),
        );
      }
      // simple return type
      if (fn.outputs.length === 1) {
        const decodedTx = web3Api.eth.abi.decodeParameter(
          fn.outputs[0].type,
          tx
        );
        const result: any[] = [];
        result.push(decodedTx);
        this.state.functionNameToFunctionOutput.set(fn.name, result);
      } else if (fn.outputs.length > 1) {
        const decodedTxMap = web3Api.eth.abi.decodeParameters(
          fn.outputs.map((output) => output.type),
          tx
        );
        // complex return type
        const processed = Array.from(Object.values(decodedTxMap));
        this.state.functionNameToFunctionOutput.set(fn.name, processed);
      }
    };

    const loadContractAbi = () => {
      const { contractAddress } = vnode.attrs;
      const contract: Contract = app.contracts.getByAddress(contractAddress);
      const abiFunctions = parseFunctionsFromABI(contract.abi);
      return abiFunctions;
    };

    const renderPayableInputs = (fnName: string) => {
      return (
        <div class="payable-input-row">
          <CWText>Amount of ETH To Send</CWText>
          <CWTextInput
            name="Contract Input Field"
            placeholder="Insert Input Here"
            oninput={(e) => {
              this.state.form.functionNameToEthToSend.set(fnName, e.target.value);
            }}
          />
        </div>
      );
    };

    const { contractAddress } = vnode.attrs;
    if (!app.contracts || !app.chain || !this.state.loaded) {
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
              if (fn.type === 'fallback') {
                return (
                  <div>
                    <div class="function-row">
                      <CWText>{fn.type}</CWText>
                      <CWText>{fn.stateMutability}</CWText>
                      <div class="functions-input-container"></div>
                      <div class="functions-output-container"></div>
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
                    {fn.stateMutability === 'payable' && renderPayableInputs(fn.type)}
                  </div>
                );
              } else {
                return (
                  <div>
                    <div class="function-row">
                      <CWText>{fn.name}</CWText>
                      <CWText>{fn.stateMutability}</CWText>
                      <div class="functions-input-container">
                        {fn?.inputs?.map(
                          (input: AbiInput, inputIdx: number) => {
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
                                      if (
                                        !this.state.form.functionNameToFunctionInputArgs.has(
                                          fn.name
                                        )
                                      ) {
                                        this.state.form.functionNameToFunctionInputArgs.set(
                                          fn.name,
                                          new Map<number, string>()
                                        );
                                        const inputArgMap =
                                          this.state.form.functionNameToFunctionInputArgs.get(
                                            fn.name
                                          );
                                        inputArgMap.set(
                                          inputIdx,
                                          e.target.value
                                        );
                                        this.state.form.functionNameToFunctionInputArgs.set(
                                          fn.name,
                                          inputArgMap
                                        );
                                      } else {
                                        const inputArgMap =
                                          this.state.form.functionNameToFunctionInputArgs.get(
                                            fn.name
                                          );
                                        inputArgMap.set(
                                          inputIdx,
                                          e.target.value
                                        );
                                        this.state.form.functionNameToFunctionInputArgs.set(
                                          fn.name,
                                          inputArgMap
                                        );
                                      }
                                      this.state.loaded = true;
                                    }}
                                    inputValidationFn={(
                                      val: string
                                    ): [ValidationStatus, string] => {
                                      // TODO Array Validation will be complex. Check what cases we want to cover here
                                      if (input.type.slice(-2) === '[]') {
                                        if (
                                          val[0] !== '[' ||
                                          val[val.length - 1] !== ']'
                                        ) {
                                          return [
                                            'failure',
                                            'Input must be an array',
                                          ];
                                        } else {
                                          return ['success', ''];
                                        }
                                      }
                                      if (input.type === 'bool') {
                                        if (val !== 'true' && val !== 'false') {
                                          return [
                                            'failure',
                                            'Input must be a boolean',
                                          ];
                                        }
                                      }
                                      if (
                                        input.type.substring(0, 4) === 'uint'
                                      ) {
                                        if (!Number.isNaN(Number(val))) {
                                          return ['success', ''];
                                        } else {
                                          return [
                                            'failure',
                                            'Input must be a number',
                                          ];
                                        }
                                      } else if (input.type === 'bool') {
                                        if (val === 'true' || val === 'false') {
                                          return ['success', ''];
                                        } else {
                                          return [
                                            'failure',
                                            'Input must be a boolean',
                                          ];
                                        }
                                      } else if (input.type === 'address') {
                                        if (val.length === 42) {
                                          return ['success', ''];
                                        } else {
                                          return [
                                            'failure',
                                            'Input must be an address',
                                          ];
                                        }
                                      } else {
                                        return ['success', ''];
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                      <div class="functions-output-container">
                        {fn?.outputs?.map((output: AbiOutput, i) => {
                          const fnOutputArray =
                            this.state.functionNameToFunctionOutput.get(
                              fn.name
                            );
                          return (
                            <div>
                              <div class="function-outputs">
                                <CWText>[{i}]</CWText>
                                <CWText>{output.type}</CWText>
                                <CWText>{output.name}</CWText>
                              </div>
                              <div>
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
                    {fn.stateMutability === 'payable' && renderPayableInputs(fn.name)}
                  </div>
                );
              }
            })}
          </div>
        </div>
      </Sublayout>
    );
  }
}

export default GeneralContractPage;
