/* @jsx m */

import 'pages/general_contract/index.scss';
import app from 'state';
import { Contract } from 'client/scripts/models';
import m from 'mithril';
import { notifySuccess } from 'controllers/app/notifications';
import { BigNumber } from 'ethers';
import Ethereum from 'client/scripts/controllers/chain/ethereum/main';
import EthereumChain from 'client/scripts/controllers/chain/ethereum/chain';
import {
  parseFunctionsFromABI,
  getEtherscanABI,
} from '../../../helpers/abi_utils';
import {
  AbiFunction,
  AbiFunctionInput,
  AbiFunctionOutput,
} from '../../../helpers/types';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTextInput } from '../../components/component_kit/cw_text_input';
import { ValidationStatus } from '../../components/component_kit/cw_validation_text';
import { ChainBase } from '../../../../../../common-common/src/types';

class GeneralContractPage
  implements m.ClassComponent<{ contractAddress?: string }>
{
  private functionInputArgs: [[]];

  oninit(vnode) {
    this.functionInputArgs = [[]];
  }

  view(vnode) {
    const callFunction = async (fn: AbiFunction) => {
      const sender = app.user.activeAccount;
      // get querying wallet
      const signingWallet = app.wallets.locateWallet(
        sender,
        ChainBase.Ethereum
      );

      // get chain
      const chain = (app.chain as Ethereum).chain;

      // handle array and int types
      console.log('function called');
      // const processedArgs = fn.inputs.map((arg, idx) => {
      //   const type = types[idx];
      //   if (type.substring(0, 4) === 'uint') return BigNumber.from(arg);
      //   if (type.slice(-2) === '[]') return JSON.parse(arg);
      //   return arg;
      // });
    };

    // TODO: figure out when to use this method properly
    const loadAbiFromEtherscan = async (address: string) => {
      try {
        const etherscanAbi = await getEtherscanABI('mainnet', address);
        const abiString = JSON.stringify(etherscanAbi);
        return parseFunctionsFromABI(abiString);
      } catch (error) {
        console.log(error);
      }
    };

    const loadContractAbi = (address: string) => {
      const contract: Contract =
        app.contracts.store.getContractByAddress(address);
      const abiFunctions = parseFunctionsFromABI(contract.abi);
      if (abiFunctions) {
        return abiFunctions;
      } else {
        loadAbiFromEtherscan(address);
      }
    };

    const { contractAddress } = vnode.attrs;
    if (!app.contracts) {
      return <PageLoading title="General Contract" />;
    }
    // <PageNotFound content="Contract ABI UI Generator Only Available for Ethereum based/>

    return (
      <Sublayout>
        {!(app.chain.chain instanceof EthereumChain) ? (
          <PageNotFound content="Contract ABI UI Generator Only Available for Ethereum based Chains" />
        ) : (
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
              {loadContractAbi(contractAddress).map(
                (fn: AbiFunction, fnIdx: number) => {
                  return (
                    <div class="function-row">
                      <CWText>{fn.name}</CWText>
                      <CWText>{fn.stateMutability}</CWText>
                      <div class="functions-input-container">
                        {fn.inputs.map((input: AbiFunctionInput, i) => {
                          return (
                            <div>
                              <div class="function-inputs">
                                <CWText>[{i}]</CWText>
                                <CWText>{input.type}</CWText>
                                <CWText>{input.name}</CWText>
                              </div>
                              <div>
                                <CWTextInput
                                  name="Contract Input Field"
                                  placeholder="Insert Input Here"
                                  oninput={(e) => {
                                    // this.input = e.target.value;
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
                                    if (input.type.substring(0, 4) === 'uint') {
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
                        })}
                      </div>
                      <div class="functions-output-container">
                        {fn.outputs.map((output: AbiFunctionOutput, i) => {
                          return (
                            <div class="function-outputs">
                              <CWText>[{i}]</CWText>
                              <CWText>{output.type}</CWText>
                              <CWText>{output.name}</CWText>
                            </div>
                          );
                        })}
                      </div>
                      <div class="function-call">
                        <CWButton
                          label="Submit"
                          onclick={() => {
                            notifySuccess('Submit Call button clicked!');
                            callFunction(fn);
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}
      </Sublayout>
    );
  }
}

export default GeneralContractPage;
