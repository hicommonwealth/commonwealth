import { providers } from 'ethers';
import {
  GovernorAlpha,
  GovernorBravoDelegate,
  GovernorCompatibilityBravo,
  GovernorAlpha__factory,
  GovernorBravoDelegate__factory,
  GovernorCompatibilityBravo__factory,
} from 'common-common/src/eth/types';
import { GovVersion } from './types';
import { RedisCache } from 'common-common/src/redisCache';
import { RedisNamespaces } from 'common-common/src/types';

type ContractAndVersion = {
  version: GovVersion;
  contract: GovernorAlpha | GovernorBravoDelegate | GovernorCompatibilityBravo;
}

/**
 * This function determines which compound contract version is being used at the given address. Note that the returned
 * contract and gov version is not guaranteed to exactly match the deployed contract.
 * @param compoundGovAddress
 * @param provider
 */
async function deriveCompoundGovContractAndVersion(
  compoundGovAddress: string,
  provider: providers.Web3Provider
): Promise<ContractAndVersion> {
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

function getCompoundGovContract(
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

export async function getCompoundGovContractAndVersion(
  redis: RedisCache,
  compoundGovAddress: string,
  provider: providers.Web3Provider
): Promise<ContractAndVersion> {
  const govVersion = await redis.getKey(
    RedisNamespaces.Compound_Gov_Version,
    compoundGovAddress
  ) as GovVersion | undefined;

  if (!govVersion) {
    const result = await deriveCompoundGovContractAndVersion(
      compoundGovAddress,
      provider
    );
    await redis.setKey(
      RedisNamespaces.Compound_Gov_Version,
      compoundGovAddress,
      result.version
    );
    return result;
  }

  const contract = getCompoundGovContract(
    govVersion,
    compoundGovAddress,
    provider
  );
  return { version: govVersion, contract };
}
