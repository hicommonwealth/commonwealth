import { Contract, providers } from 'ethers';
import {
  GovernorAlpha,
  GovernorBravoDelegate,
  GovernorCompatibilityBravo,
  Governor,
  GovernorAlpha__factory,
  GovernorBravoDelegate__factory,
  Governor__factory,
  GovernorCompatibilityBravo__factory,
} from 'common-common/src/eth/types';
import { GovVersion } from './types';
import { TypedEvent } from 'common-common/src/eth/types/commons';

/**
 * This function determines which compound contract version is being used at the given address. Note that the returned
 * contract and gov version is not guaranteed to exactly match the deployed contract.
 * @param compoundGovAddress
 * @param provider
 */
export async function getCompoundGovContractAndVersion(
  compoundGovAddress: string,
  provider: providers.Web3Provider
): Promise<{
  version: GovVersion;
  contract: GovernorAlpha | GovernorBravoDelegate | GovernorCompatibilityBravo;
}> {
  try {
    const contract = GovernorAlpha__factory.connect(
      compoundGovAddress,
      provider
    );
    await contract.guardian();
    return { version: GovVersion.Alpha, contract };
  } catch (e) {
    try {
      const contract = GovernorBravoDelegate__factory.connect(
        compoundGovAddress,
        provider
      );
      await contract.proposalCount();
      await contract.initialProposalId();
      return { version: GovVersion.Bravo, contract };
    } catch (e1) {
      try {
        const contract = GovernorCompatibilityBravo__factory.connect(
          compoundGovAddress,
          provider
        );
        await contract.COUNTING_MODE();
        return { version: GovVersion.OzBravo, contract };
      } catch (e2) {
        throw new Error(
          `Failed to find Compound contract version at ${compoundGovAddress}`
        );
      }
    }
  }
}

export function getCompoundGovContract(
  govVersion: GovVersion,
  compoundGovAddress: string,
  provider: providers.Web3Provider
) {
  switch (govVersion) {
    case GovVersion.Alpha:
      return GovernorAlpha__factory.connect(compoundGovAddress, provider);
    case GovVersion.Bravo:
      return GovernorBravoDelegate__factory.connect(
        compoundGovAddress,
        provider
      );
    case GovVersion.OzBravo:
      return GovernorCompatibilityBravo__factory.connect(
        compoundGovAddress,
        provider
      );
    default:
      throw new Error(`Invalid Compound contract version: ${govVersion}`);
  }
}

/**
 * Used to fetch events in a batched manner (e.g. 500 blocks at a time) if the given RPC provider has a block limit.
 * @param contract
 * @param queryFilterEvents
 */
export async function getEvents<
  ContractType extends Contract,
  EventType extends TypedEvent<any>
>(
  contract: ContractType,
  queryFilterEvents: (
    contract: ContractType,
    fromBlock?: number,
    toBlock?: number | 'latest'
  ) => Promise<EventType[]>
): Promise<EventType[]> {
  const MAX_BLOCKS_PER_QUERY = 500;

  let result: EventType[] | EventType[][];
  try {
    result = await queryFilterEvents(contract);
    return result;
  } catch (e) {
    if (e.message.includes('range')) {
      console.log(
        'Querying all blocks failed. Retrying with multiple smaller block ranges...'
      );
    } else {
      console.error(e);
      return;
    }
  }

  const latestBlock = await contract.provider.getBlockNumber();
  let startBlock = 0;
  const eventPromises: Promise<EventType[]>[] = [];
  while (startBlock <= latestBlock) {
    const toBlock = Math.min(startBlock + MAX_BLOCKS_PER_QUERY, latestBlock);
    eventPromises.push(queryFilterEvents(contract, startBlock, toBlock));
    startBlock = toBlock + 1;
  }

  result = await Promise.all(eventPromises);
  return result.flat();
}
