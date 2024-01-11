import { ERC165__factory } from '@hicommonwealth/chains';
import Ajv from 'ajv';
import { CosmosSDK } from 'cosmos-sdk';
import { ethers } from 'ethers';
import db from 'server/database';
import requirementsSchema from './requirementsSchema_v1.json';
import { Requirement } from './requirementsTypes';

const Errors = {
  InvalidRequirements: 'Invalid requirements',
  InvalidAddress: 'Invalid address',
  ContractNotFound: 'Contract not found',
  InvalidContractType: 'Invalid contract type',
};

const InterfaceIds = {
  ERC1155: '0xd9b67a26',
  ERC721: '0x80ac58cd',
  ERC20: '0x36372b07',
};

function isValidEVMContractAddress(address: string): boolean {
  const addressRegex = /^(0x)?[0-9a-fA-F]{40}$/;
  return addressRegex.test(address);
}

function isValidCosmosContractAddress(address: string): boolean {
  const addressRegex = /^cosmos1[a-z0-9]{38}$/;
  return addressRegex.test(address);
}

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

async function getEVMContractType(
  contractAddress: string,
  network_url: string,
): Promise<string | null> {
  const provider = new ethers.providers.JsonRpcProvider(network_url);
  const contract = ERC165__factory.connect(contractAddress, provider);

  // Check if the contract implements ERC1155 interface
  const supportsERC1155 = await contract.supportsInterface(
    InterfaceIds.ERC1155,
  );
  if (supportsERC1155) {
    return 'erc1155';
  }

  // Check if the contract implements ERC721 interface
  const supportsERC721 = await contract.supportsInterface(InterfaceIds.ERC721);
  if (supportsERC721) {
    return 'erc721';
  }

  // Check if the contract implements ERC20 interface
  const supportsERC20 = await contract.supportsInterface(InterfaceIds.ERC20);
  if (supportsERC20) {
    return 'erc20';
  }

  // If none of the above interfaces are implemented, return null
  return null;
}

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
        const isValidAddress = await isValidEVMContractAddress(
          contract_address,
        );

        if (!isValidAddress) {
          return new Error(`${Errors.InvalidAddress}: ${contract_address}`);
        }

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

        const isContractType = await getEVMContractType(
          contract_address,
          `rpcURL`,
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
        const isValidAddress = isValidCosmosContractAddress(contract_address);

        if (!isValidAddress) {
          return new Error(`${Errors.InvalidAddress}: ${contract_address}`);
        }

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
          `rpcURL`,
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
