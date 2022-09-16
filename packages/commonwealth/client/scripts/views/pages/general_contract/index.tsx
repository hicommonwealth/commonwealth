/* @jsx m */

import 'pages/general_contract/index.scss';
import app from 'state';
import { Contract } from 'client/scripts/models';
import m from 'mithril';
import {
  parseFunctionsFromABI,
  getEtherscanABI,
} from '../../../helpers/abi_utils';
import {
  AbiFunction,
  AbiFunctionInput,
  AbiFunctionOutput,
} from '../../../helpers/types';
import { PageLoading } from '../loading';
import Sublayout from '../../sublayout';
import { CWText } from '../../components/component_kit/cw_text';
import { CWButton } from '../../components/component_kit/cw_button';
import { CWTextInput } from '../../components/component_kit/cw_text_input';

class GeneralContractPage
  implements m.ClassComponent<{ contractAddress?: string }>
{
  private input: string;

  view(vnode) {
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

    loadContractAbi(contractAddress);

    if (!app.contracts) {
      return <PageLoading title="General Contract" />;
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
            {loadContractAbi(contractAddress).map((fn: AbiFunction, idx: number) => {
              console.log(fn);
              return (
                  <div class="function-row">
                    <CWText>{fn.name}</CWText>
                    <CWText>{fn.stateMutability}</CWText>
                    <div class="functions-input-container">
                    {fn.inputs.map((input, i) => {
                      return (
                        <div class="function-inputs">
                          <CWText>[{i}]</CWText>
                          <CWText>{input.type}</CWText>
                          <CWText>{input.name}</CWText>
                        </div>
                      );
                    })}
                    </div>
                    <div class="functions-output-container">
                      {fn.outputs.map((output, i) => {
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
                      <CWButton label="Submit"/>
                      {/* <CWTextInput
                        placeholder="Input"
                        oninput={(e) => {
                          this.input = e.target.value;
                        }}
                      /> */}
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
