import React, { useState } from 'react';
import type { Result } from 'ethers/lib/utils';

import 'pages/general_contract/index.scss';

import app from 'state';
import type { Contract } from 'models';
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
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';

type GeneralContractPageProps = {
  contractAddress?: string;
};

const GeneralContractPage = ({ contractAddress }: GeneralContractPageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [functionNameToFunctionOutput, setFunctionNameToFunctionOutput] =
    useState<Map<string, Result>>(new Map<string, Result>());
  const [functionNameToFunctionInputArgs, setFunctionNameToFunctionInputArgs] =
    useState<Map<string, Map<number, string>>>(
      new Map<string, Map<number, string>>()
    );

  const fetchContractAbi = async (contract: Contract) => {
    if (contract.abi === undefined) {
      try {
        // use the contract address to fetch the abi using controller
        await app.contracts.checkFetchEtherscanForAbi(contract.address);
        // TODO The UI Should In One Go show the abi form after successfully fetching the abi
        // from etherscan, which it does not do rn
      } catch (err) {
        notifyError(
          err.message || `Fetching ABI for ${contract.address} failed: ${err}`
        );
      }
    }
  };

  const callFunction = async (_contractAddress: string, fn: AbiItem) => {
    try {
      setLoading(true);

      const contract = app.contracts.getByAddress(_contractAddress);

      if (!contract) {
        throw new Error('Contract not found');
      }

      const result = await callContractFunction(
        contract,
        fn,
        functionNameToFunctionInputArgs
      );

      functionNameToFunctionOutput.set(fn.name, result);
      setSaving(false);
      setLoaded(true);
      setLoading(false);
    } catch (err) {
      notifyError(err.message || `Calling Function ${fn.name} failed`);
      setLoading(false);
    }
  };

  const loadContractAbi = (): AbiItem[] => {
    const contract: Contract = app.contracts.getByAddress(contractAddress);

    if (!contract || !contract.abi) {
      // TODO: show screen for "no ABI found" -- or fetch data
      return [];
    }

    const abiFunctions = parseFunctionsFromABI(contract.abi);

    return abiFunctions;
  };

  if (app.contracts.getCommunityContracts().length > 0) {
    const contract: Contract = app.contracts.getByAddress(contractAddress);

    if (contract) {
      setLoaded(true);
    }

    fetchContractAbi(contract);
  }

  if (!app.contracts || !app.chain) {
    return <PageLoading message="General Contract" />;
  } else {
    if (app.chain.base !== ChainBase.Ethereum) {
      return (
        <PageNotFound message="Contract ABI UI Generator Only Available for Ethereum based Chains" />
      );
    }
  }

  return (
    <Sublayout>
      <div className="GeneralContractPage">
        <CWText type="h4">General Contract</CWText>
        <CWText>Contract Address: {contractAddress}</CWText>
        <div className="functions-container">
          <div className="header-row">
            <CWText>Name</CWText>
            <CWText>State Mutability</CWText>
            <CWText>Inputs</CWText>
            <CWText>Outputs</CWText>
            <CWText>Call Function</CWText>
          </div>
          {loadContractAbi().map((fn: AbiItem) => {
            return (
              <div className="function-row">
                <CWText>{fn.name}</CWText>
                <CWText>{fn.stateMutability}</CWText>
                <div className="functions-input-container">
                  {fn.inputs.map((input: AbiInput, inputIdx: number) => {
                    return (
                      <div>
                        <div className="function-inputs">
                          <CWText>[{inputIdx}]</CWText>
                          <CWText>{input.type}</CWText>
                          <CWText>{input.name}</CWText>
                        </div>
                        <div>
                          <CWTextInput
                            name="Contract Input Field"
                            placeholder="Insert Input Here"
                            onInput={(e) => {
                              handleMappingAbiInputs(
                                inputIdx,
                                e.target.value,
                                fn.name,
                                functionNameToFunctionInputArgs
                              );

                              setLoaded(true);
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
                <div className="functions-output-container">
                  {fn.outputs.map((output: AbiOutput, i) => {
                    const fnOutputArray = functionNameToFunctionOutput.get(
                      fn.name
                    );
                    return (
                      <div>
                        <div className="function-outputs">
                          <CWText>[{i}]</CWText>
                          <CWText>{output.type}</CWText>
                          <CWText>{output.name}</CWText>
                        </div>
                        <div>
                          {loading && <CWSpinner />}
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
                <div className="function-call">
                  <CWButton
                    label="Submit"
                    disabled={saving || !loaded}
                    onClick={() => {
                      notifySuccess('Submit Call button clicked!');
                      setSaving(true);

                      try {
                        callFunction(contractAddress, fn);
                      } catch (err) {
                        notifyError(
                          err.message || 'Submitting Function Call failed'
                        );
                      } finally {
                        setSaving(false);
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
};

export default GeneralContractPage;
