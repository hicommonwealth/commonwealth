import { setupWasmExtension } from '@cosmjs/cosmwasm-stargate';
import { QueryClient } from '@cosmjs/stargate';
import { HttpClient, Tendermint34Client } from '@cosmjs/tendermint-rpc';
import { ethers } from 'ethers';
import app from 'state';
import {
  CW_SPECIFICATIONS,
  ERC_SPECIFICATIONS,
  TOKENS,
} from '../../../common/constants';
import { convertRequirementAmountFromTokensToWei } from '../../../common/helpers';
import { GroupResponseValuesType } from '../GroupForm/index.types';

// Makes create/edit group api payload from provided form submit values
export const makeGroupDataBaseAPIPayload = (
  formSubmitValues: GroupResponseValuesType,
) => {
  const payload = {
    chainId: app.activeChainId(),
    address: app.user.activeAccount.address,
    groupName: formSubmitValues.groupName.trim(),
    groupDescription: (formSubmitValues.groupDescription || '').trim(),
    topicIds: formSubmitValues.topics.map((x) => parseInt(x.value)),
    requirementsToFulfill:
      formSubmitValues.requirementsToFulfill === 'ALL'
        ? formSubmitValues.requirements.length
        : formSubmitValues.requirementsToFulfill,
    requirements: [],
  };

  // map requirements and add to payload
  formSubmitValues.requirements.map((x) => {
    // for eth base
    if (
      x.requirementType === ERC_SPECIFICATIONS.ERC_20 ||
      x.requirementType === ERC_SPECIFICATIONS.ERC_721 ||
      x.requirementType === ERC_SPECIFICATIONS.ERC_1155 ||
      x.requirementType === TOKENS.EVM_TOKEN
    ) {
      payload.requirements.push({
        rule: 'threshold',
        data: {
          threshold: convertRequirementAmountFromTokensToWei(
            x.requirementType as any,
            x.requirementAmount,
          ),
          source: {
            source_type: x.requirementType,
            evm_chain_id: parseInt(x.requirementChain),
            ...(x.requirementType !== TOKENS.EVM_TOKEN && {
              contract_address: x.requirementContractAddress.trim(),
            }),
            ...(x.requirementType === ERC_SPECIFICATIONS.ERC_1155 && {
              token_id: x.requirementTokenId.trim(),
            }),
          },
        },
      });
      return;
    }

    // for cosmos base
    if (
      x.requirementType === TOKENS.COSMOS_TOKEN ||
      x.requirementType === CW_SPECIFICATIONS.CW_721
    ) {
      payload.requirements.push({
        rule: 'threshold',
        data: {
          threshold: convertRequirementAmountFromTokensToWei(
            x.requirementType as any,
            x.requirementAmount,
          ),
          source: {
            source_type: x.requirementType,
            cosmos_chain_id: x.requirementChain,
            ...(x.requirementType !== TOKENS.COSMOS_TOKEN && {
              contract_address: x.requirementContractAddress.trim(),
            }),
            ...(x.requirementType === TOKENS.COSMOS_TOKEN && {
              token_symbol: 'COS',
            }),
          },
        },
      });
      return;
    }
  });

  return payload;
};

const Abis = {
  ERC20: ['function decimals() view returns (uint256)'],
  ERC721: ['function balanceOf(address owner) view returns (uint256)'],
  ERC1155: [
    'function isApprovedForAll(address account, address operator) view returns (bool)',
  ],
};

export const getErc20Decimals = async (
  address: string,
  network_url,
): Promise<number | null> => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(network_url);

    const contractERC20 = new ethers.Contract(address, Abis.ERC20, provider);

    const decimals = await contractERC20.decimals();
    return decimals;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const isEVMAddressContract = async (
  address: string,
  network_url: string,
): Promise<boolean> => {
  const provider = new ethers.providers.JsonRpcProvider(network_url);
  try {
    const code = await provider.getCode(address);
    return code !== '0x';
  } catch (error) {
    console.error('Error checking address:', error);
    return false;
  }
};

export const isCosmosAddressContract = async (
  address: string,
  network_url: string,
): Promise<boolean> => {
  try {
    const client = new HttpClient(network_url);
    const tmClient = await Tendermint34Client.create(client);
    const api = QueryClient.withExtensions(tmClient, setupWasmExtension);

    const contractInfo = await api.wasm.getContractInfo(address);
    if (contractInfo) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    return false;
  }
};

export const getEVMContractType = async (
  contractAddress,
  network_url,
): Promise<string | null> => {
  const provider = new ethers.providers.JsonRpcProvider(network_url);

  const contractERC20 = new ethers.Contract(
    contractAddress,
    Abis.ERC20,
    provider,
  );
  const contractERC721 = new ethers.Contract(
    contractAddress,
    Abis.ERC721,
    provider,
  );
  const contractERC1155 = new ethers.Contract(
    contractAddress,
    Abis.ERC1155,
    provider,
  );

  try {
    // Check for ERC20
    await contractERC20.decimals();
    return 'erc20';
  } catch (e) {
    /* Not ERC20 */
  }

  try {
    // Check for ERC721
    await contractERC721.balanceOf(ethers.constants.AddressZero);
    return 'erc721';
  } catch (e) {
    /* Not ERC721 */
  }

  try {
    // Check for ERC1155
    await contractERC1155.isApprovedForAll(
      ethers.constants.AddressZero,
      ethers.constants.AddressZero,
    );
    return 'erc1155';
  } catch (e) {
    /* Not ERC1155 */
  }

  console.log(
    'Contract type is unknown or does not implement standard interfaces.',
  );
  return null;
};

export const getCosmosContractType = async (
  address: string,
  network_url: string,
): Promise<string | null> => {
  try {
    const client = new HttpClient(network_url);
    const tmClient = await Tendermint34Client.create(client);
    const api = QueryClient.withExtensions(tmClient, setupWasmExtension);

    const contractInfo = await api.wasm.getContractInfo(address);
    if (contractInfo && contractInfo.contractInfo.codeId.equals(49)) {
      return 'cw721';
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
};
