/* eslint-disable react/jsx-key */
/* eslint-disable react-hooks/exhaustive-deps */
import { ChainBase } from '@hicommonwealth/core';
import { parseFunctionsFromABI } from 'abi_utils';
import { notifyError, notifySuccess } from 'controllers/app/notifications';
import { callContractFunction } from 'controllers/chain/ethereum/callContractFunction';
import { ethers } from 'ethers';
import type { Result } from 'ethers/lib/utils';
import {
  handleMappingAbiInputs,
  validateAbiInput,
} from 'helpers/abi_form_helpers';
import 'pages/general_contract/index.scss';
import React, { useEffect, useRef, useState } from 'react';
import app from 'state';
import { CWButton } from 'views/components/component_kit/cw_button';
import { CWSpinner } from 'views/components/component_kit/cw_spinner';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import type { AbiInput, AbiItem, AbiOutput } from 'web3-utils/types';
import type Contract from '../../../models/Contract';
import { PageNotFound } from '../404';
import { PageLoading } from '../loading';

type GeneralContractPageProps = {
  contractAddress?: string;
};

const GeneralContractPage = ({ contractAddress }: GeneralContractPageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contract, setContract] = useState<Contract>();
  const functionNameToFunctionOutput = useRef<Map<string, Result>>(
    new Map<string, Result>(),
  );
  const [abiItems, setAbiItems] = useState<AbiItem[]>([]);
  const functionNameToFunctionInputArgs = useRef<
    Map<string, Map<number, string>>
  >(new Map<string, Map<number, string>>());

  const fetchContractAbi = async (_contract: Contract) => {
    if (_contract.abi === undefined) {
      try {
        // use the contract address to fetch the abi using controller
        await app.contracts.checkFetchEtherscanForAbi(_contract.address);
        // TODO The UI Should In One Go show the abi form after successfully fetching the abi
        // from etherscan, which it does not do rn
      } catch (err) {
        notifyError(
          err.message || `Fetching ABI for ${_contract.address} failed: ${err}`,
        );
      }
    }
  };

  useEffect(() => {
    loadContractAbi().then(setAbiItems);
  }, [contractAddress, app.contracts]);

  const callFunction = async (_contractAddress: string, fn: AbiItem) => {
    try {
      setLoading(true);

      if (!contract) {
        throw new Error('Contract not found');
      }

      // Convert map of number to string to array of string
      const inputArgs = functionNameToFunctionInputArgs.current.get(fn.name);
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

      functionNameToFunctionOutput.current.set(
        fn.name,
        ethersInterface.decodeFunctionResult(fn.name, result),
      );
      setSaving(false);
      setLoaded(true);
      setLoading(false);
    } catch (err) {
      notifyError(err.message || `Calling Function ${fn.name} failed`);
      setLoading(false);
    }
  };

  const loadContractAbi = async (): Promise<AbiItem[]> => {
    const _contract: Contract = app.contracts.getByAddress(contractAddress);
    setContract(_contract);

    if (!_contract?.abi) {
      // TODO: show screen for "no ABI found" -- or fetch data
      if (app.contracts.getCommunityContracts().length > 0 && !contract) {
        fetchContractAbi(_contract);
      }
      return [];
    } else {
      setLoaded(!!contract);
      return parseFunctionsFromABI(_contract.abi);
    }
  };

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
        {abiItems.map((fn: AbiItem) => {
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
                              functionNameToFunctionInputArgs.current,
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
                  const fnOutputArray =
                    functionNameToFunctionOutput.current.get(fn.name);
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
                        err.message || 'Submitting Function Call failed',
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
  );
};

export default GeneralContractPage;
