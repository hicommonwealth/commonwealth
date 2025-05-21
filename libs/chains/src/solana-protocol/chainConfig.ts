// Supported Solana networks
export enum SolanaNetworks {
  Mainnet = 'mainnet-beta',
  Devnet = 'devnet',
  Testnet = 'testnet',
  Localnet = 'localnet',
}

// Solana program IDs (addresses) for different contest programs
// These will need to be populated with actual program addresses once available
export const contestPrograms = {
  [SolanaNetworks.Mainnet]: {
    singleContestProgram: '', // To be populated when available
    contestContentProgram: '', // To be populated when available
    votingProgram: '', // To be populated when available
  },
  [SolanaNetworks.Devnet]: {
    singleContestProgram: '', // To be populated when available
    contestContentProgram: '', // To be populated when available
    votingProgram: '', // To be populated when available
  },
  [SolanaNetworks.Testnet]: {
    singleContestProgram: '', // To be populated when available
    contestContentProgram: '', // To be populated when available
    votingProgram: '', // To be populated when available
  },
  [SolanaNetworks.Localnet]: {
    singleContestProgram: 'ContestProgramLocalPlaceholder111111111111111',
    contestContentProgram: 'ContentProgramLocalPlaceholder111111111111111',
    votingProgram: 'VotingProgramLocalPlaceholder1111111111111111',
  },
};

/**
 * Type guard to verify if a given string is a value in the SolanaNetworks enum.
 * @param network - The string to verify.
 * @returns boolean - true if the string is a valid Solana network.
 */
export function isValidSolanaNetwork(
  network: string,
): network is SolanaNetworks {
  return Object.values(SolanaNetworks).includes(network as SolanaNetworks);
}

/**
 * Assert that the provided network is a valid Solana network.
 * @param network - The network to verify.
 * @throws Error - If the network is not valid.
 */
export function mustBeSolanaNetwork(
  network?: string | null | undefined,
): asserts network is SolanaNetworks {
  if (
    !network ||
    !Object.values(SolanaNetworks).includes(network as SolanaNetworks)
  ) {
    throw new Error(`${network} is not a valid Solana network`);
  }
}

/**
 * Get all program IDs for a given Solana network.
 * @param network - The Solana network.
 * @returns An array of program IDs for the specified network.
 */
export function getAllProgramIds(network: SolanaNetworks): string[] {
  const programConfig = contestPrograms[network];
  return Object.values(programConfig).filter((id) => id !== '');
}
