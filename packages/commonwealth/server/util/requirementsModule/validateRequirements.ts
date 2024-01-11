import Ajv from 'ajv';
import { CosmosSDK } from 'cosmos-sdk';
import Web3 from 'web3';
import requirementsSchema from './requirementsSchema_v1.json';
import { Requirement } from './requirementsTypes';

const Errors = {
  InvalidRequirements: 'Invalid requirements',
  InvalidAddress: 'Invalid address',
  ContractNotFound: 'Contract not found',
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
  const web3 = new Web3(network_url);
  try {
    const code = await web3.eth.getCode(address);
    return code !== '0x';
  } catch (error) {
    console.error('Error checking address:', error);
    return false;
  }
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
        const isAddressContract = await isEVMAddressContract(
          contract_address,
          `rpcURL`,
        );

        if (!isAddressContract) {
          return new Error(`${Errors.ContractNotFound}: ${contract_address}`);
        }
      }

      if (source_type === 'cw721') {
        const contract_address = requirement.data.source.contract_address;
        const isValidAddress = isValidCosmosContractAddress(contract_address);

        if (!isValidAddress) {
          return new Error(`${Errors.InvalidAddress}: ${contract_address}`);
        }

        const cosmosId = requirement.data.source.cosmos_chain_id;
        const isAddressContract = await isEVMAddressContract(
          contract_address,
          `rpcURL`,
        );

        if (!isAddressContract) {
          return new Error(`${Errors.ContractNotFound}: ${contract_address}`);
        }
      }
    }
  });

  return null;
}
