import { Requirement } from '@hicommonwealth/core';
import Ajv from 'ajv';
import { CosmosSDK } from 'cosmos-sdk';
import { ethers } from 'ethers';
import db from 'server/database';
import requirementsSchema from './requirementsSchema_v1.json';

const Errors = {
  InvalidRequirements: 'Invalid requirements',
  InvalidAddress: 'Invalid address',
  ContractNotFound: 'Contract not found',
  InvalidContractType: 'Invalid contract type',
};

const Abis = {
  ERC20: ['function totalSupply() view returns (uint256)'],
  ERC721: ['function balanceOf(address owner) view returns (uint256)'],
  ERC1155: [
    'function isApprovedForAll(address account, address operator) view returns (bool)',
  ],
};

async function isEVMAddressContract(
  address: string,
  network_url: string,
): Promise<boolean> {
  const provider = new ethers.providers.JsonRpcProvider(network_url);
  try {
    const code = await provider.getCode(address);
    return code !== '0x';
  } catch (error) {
    console.error('Error checking address:', error);
    return false;
  }
}

async function getCosmosContractType(
  contractAddress: string,
  network_url: string,
): Promise<string | null> {
  // Implement the logic to query the Cosmos chain and get the contract type
  const cosmosSDK = new CosmosSDK(network_url);
  const contractInfo = await cosmosSDK.getContractInfo(contractAddress);

  if (contractInfo) {
    return contractInfo.type;
  }

  return null;
}

const checkContractType = async (
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
    await contractERC20.totalSupply();
    console.log(contractAddress, 'is an ERC20 contract.');
    return 'erc20';
  } catch (e) {
    /* Not ERC20 */
  }

  try {
    // Check for ERC721
    await contractERC721.balanceOf(ethers.constants.AddressZero);
    console.log(contractAddress, 'is an ERC721 contract.');
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
    console.log(contractAddress, 'is an ERC1155 contract.');
    return 'erc1155';
  } catch (e) {
    /* Not ERC1155 */
  }

  console.log(
    'Contract type is unknown or does not implement standard interfaces.',
  );
  return null;
};

// async function getEVMContractType(
//   contractAddress: string,
//   network_url: string,
// ): Promise<string | null> {
//   const provider = new ethers.providers.JsonRpcProvider(network_url);
//   const contract = ERC165__factory.connect(contractAddress, provider);

//   // Check if the contract implements ERC1155 interface
//   const supportsERC1155 = await contract.supportsInterface(
//     InterfaceIds.ERC1155,
//   );

//   if (supportsERC1155) {
//     return 'erc1155';
//   }

//   // Check if the contract implements ERC721 interface
//   const supportsERC721 = await contract.supportsInterface(InterfaceIds.ERC721);
//   if (supportsERC721) {
//     return 'erc721';
//   }

//   // Check if the contract implements ERC20 interface
//   const supportsERC20 = await contract.supportsInterface(InterfaceIds.ERC20);
//   if (supportsERC20) {
//     return 'erc20';
//   }

//   // If none of the above interfaces are implemented, return null
//   return null;
// }

async function isCosmosAddressContract(
  address: string,
  network_url: string,
): Promise<boolean> {
  // Implement the logic to query the Cosmos chain and check if the address is a contract
  const cosmosSDK = new CosmosSDK(network_url);
  const accountInfo = await cosmosSDK.getAccountInfo(address);
  return accountInfo.code_hash !== '';
}

const ajv = new Ajv();

/**
 * validates a set of requirements against the schema
 * @param requirements an array of requirements types
 * @returns Error if invalid, otherwise null
 */
export default function validateRequirements(
  requirements: Requirement[],
): Error | null {
  const validateSchema = ajv.compile(requirementsSchema);
  const isValidSchema = validateSchema(requirements);

  if (!isValidSchema) {
    return new Error(
      `${Errors.InvalidRequirements}: ${JSON.stringify(validateSchema.errors)}`,
    );
  }

  requirements.forEach(async (requirement) => {
    if (requirement.rule === 'threshold') {
      const source_type = requirement.data.source.source_type;
      if (
        source_type === 'erc721' ||
        source_type === 'erc1155' ||
        source_type === 'erc20'
      ) {
        const contract_address = requirement.data.source.contract_address;
        const evmId = requirement.data.source.evm_chain_id;
        const node = await db.ChainNode.findOne({
          where: {
            eth_chain_id: evmId,
          },
          attributes: ['url'],
        });

        const isAddressContract = await isEVMAddressContract(
          contract_address,
          node.url,
        );

        if (!isAddressContract) {
          return new Error(`${Errors.ContractNotFound}: ${contract_address}`);
        }

        const isContractType = await checkContractType(
          contract_address,
          node.url,
        );
        if (
          !isContractType ||
          requirement.data.source.source_type !== isContractType
        ) {
          return new Error(
            `${Errors.InvalidContractType}: ${contract_address}`,
          );
        }
      }

      if (source_type === 'cw721') {
        const contract_address = requirement.data.source.contract_address;
        const cosmosId = requirement.data.source.cosmos_chain_id;
        const node = await db.ChainNode.findOne({
          where: {
            cosmos_chain_id: cosmosId,
          },
          attributes: ['url'],
        });

        const isAddressContract = await isCosmosAddressContract(
          contract_address,
          node.url,
        );

        if (!isAddressContract) {
          return new Error(`${Errors.ContractNotFound}: ${contract_address}`);
        }

        const isContractType = await getCosmosContractType(
          contract_address,
          node.url,
        );
        if (
          !isContractType ||
          requirement.data.source.source_type !== isContractType
        ) {
          return new Error(
            `${Errors.InvalidContractType}: ${contract_address}`,
          );
        }
      }
    }
  });

  return null;
}
