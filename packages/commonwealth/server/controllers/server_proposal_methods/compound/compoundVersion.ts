import { RedisCache } from '@hicommonwealth/adapters';
import {
  GovernorAlpha,
  GovernorAlpha__factory,
  GovernorBravoDelegate,
  GovernorBravoDelegate__factory,
  GovernorCompatibilityBravo,
  GovernorCompatibilityBravo__factory,
  GovernorCountingSimple,
  GovernorCountingSimple__factory,
} from '@hicommonwealth/chains';
import { CacheNamespaces } from '@hicommonwealth/core';
import { providers } from 'ethers';
import { GovVersion } from './types';

type ContractAndVersion = {
  version: GovVersion;
  contract:
    | GovernorAlpha
    | GovernorBravoDelegate
    | GovernorCompatibilityBravo
    | GovernorCountingSimple;
};

/**
 * This function determines which compound contract version is being used at the given address. Note that the returned
 * contract and gov version is not guaranteed to exactly match the deployed contract.
 * @param compoundGovAddress
 * @param provider
 */
async function deriveCompoundGovContractAndVersion(
  compoundGovAddress: string,
  provider: providers.Web3Provider,
): Promise<ContractAndVersion> {
  try {
    const contract = GovernorAlpha__factory.connect(
      compoundGovAddress,
      provider,
    );
    await contract.guardian();
    return { version: GovVersion.Alpha, contract };
  } catch (e) {
    try {
      const contract = GovernorBravoDelegate__factory.connect(
        compoundGovAddress,
        provider,
      );
      await contract.proposalCount();
      await contract.initialProposalId();
      return { version: GovVersion.Bravo, contract };
    } catch (e1) {
      try {
        const contract = GovernorCountingSimple__factory.connect(
          compoundGovAddress,
          provider,
        );
        await contract.COUNTING_MODE();
        await contract.proposalVotes(1);
        return { version: GovVersion.OzCountSimple, contract };
      } catch (e2) {
        try {
          const contract = GovernorCompatibilityBravo__factory.connect(
            compoundGovAddress,
            provider,
          );
          await contract.COUNTING_MODE();
          return { version: GovVersion.OzBravo, contract };
        } catch (e3) {
          throw new Error(
            `Failed to find Compound contract version at ${compoundGovAddress}`,
          );
        }
      }
    }
  }
}

function getCompoundGovContract(
  govVersion: GovVersion,
  compoundGovAddress: string,
  provider: providers.Web3Provider,
) {
  switch (govVersion) {
    case GovVersion.Alpha:
      return GovernorAlpha__factory.connect(compoundGovAddress, provider);
    case GovVersion.Bravo:
      return GovernorBravoDelegate__factory.connect(
        compoundGovAddress,
        provider,
      );
    case GovVersion.OzBravo:
      return GovernorCompatibilityBravo__factory.connect(
        compoundGovAddress,
        provider,
      );
    case GovVersion.OzCountSimple:
      return GovernorCountingSimple__factory.connect(
        compoundGovAddress,
        provider,
      );
    default:
      throw new Error(`Invalid Compound contract version: ${govVersion}`);
  }
}

export async function getCompoundGovContractAndVersion(
  redis: RedisCache,
  compoundGovAddress: string,
  provider: providers.Web3Provider,
): Promise<ContractAndVersion> {
  const govVersion = (await redis.getKey(
    CacheNamespaces.Compound_Gov_Version,
    compoundGovAddress,
  )) as GovVersion | undefined;

  if (!govVersion) {
    const result = await deriveCompoundGovContractAndVersion(
      compoundGovAddress,
      provider,
    );
    await redis.setKey(
      CacheNamespaces.Compound_Gov_Version,
      compoundGovAddress,
      result.version,
    );
    return result;
  }

  const contract = getCompoundGovContract(
    govVersion,
    compoundGovAddress,
    provider,
  );
  return { version: govVersion, contract };
}
