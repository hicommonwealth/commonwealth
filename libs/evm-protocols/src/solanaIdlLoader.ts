/**
 * Simplified Solana IDL loader that only handles:
 * 1. Loading IDL files from directories
 * 2. Extracting program IDs
 * 3. Finding IDLs by program ID
 */
import { Idl } from '@coral-xyz/anchor';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

/**
 * Define supported Solana networks
 */
export enum SolanaNetworks {
  Mainnet = 'Mainnet',
  Devnet = 'Devnet',
}

/**
 * Structure to represent an IDL with its program ID
 */
export interface IdlWithAddress {
  programId: string;
  idl: Idl;
  network: SolanaNetworks;
}

/**
 * Cache for loaded IDLs to avoid repeated file reads
 */
const idlCache: Record<string, IdlWithAddress[]> = {
  [SolanaNetworks.Mainnet]: [],
  [SolanaNetworks.Devnet]: [],
};

/**
 * Get the directory path where IDL files are stored for a specific network
 */
function getIdlDirectoryPath(network: SolanaNetworks): string {
  // Get the directory where this file is located using import.meta.url
  const basePath = join(new URL('.', import.meta.url).pathname, 'SolanaIDLs');

  // Return the path to the network-specific directory with capitalized first letter
  // This matches our directory structure (Devnet/Mainnet) while using mainnet-beta/devnet enum values
  return join(
    basePath,
    network === SolanaNetworks.Mainnet ? 'Mainnet' : 'Devnet',
  );
}

/**
 * Load all IDLs for a specific network
 */
export function loadIdls(network: SolanaNetworks): IdlWithAddress[] {
  // Return cached IDLs if they exist
  if (idlCache[network].length > 0) {
    return idlCache[network];
  }

  try {
    const dirPath = getIdlDirectoryPath(network);

    // Check if directory exists
    if (!existsSync(dirPath)) {
      console.warn(`IDL directory not found: ${dirPath}`);
      return [];
    }

    const files = readdirSync(dirPath).filter((file) => file.endsWith('.json'));

    if (files.length === 0) {
      console.warn(`No IDL files found in ${dirPath}`);
      return [];
    }

    const idls: IdlWithAddress[] = [];

    for (const file of files) {
      try {
        const filePath = join(dirPath, file);
        const fileContent = readFileSync(filePath, 'utf-8');
        const idlData = JSON.parse(fileContent);

        // Ensure the IDL has a program ID (address field)
        if (idlData.address) {
          idls.push({
            programId: idlData.address,
            idl: idlData,
            network,
          });
        } else {
          console.warn(`IDL file ${file} does not have an address field`);
        }
      } catch (error) {
        console.error(`Error loading IDL file ${file}:`, error);
      }
    }

    // Cache the loaded IDLs
    idlCache[network] = idls;
    console.log(`Loaded ${idls.length} IDLs for network ${network}`);
    return idls;
  } catch (error) {
    console.error(`Error loading IDLs for network ${network}:`, error);
    return [];
  }
}

/**
 * Get all program IDs for a specific network
 */
export function getAllProgramIds(network: SolanaNetworks): string[] {
  const idls = loadIdls(network);
  return idls.map((idl) => idl.programId);
}

/**
 * Find a specific IDL by its program ID
 */
export function findIdlByProgramId(
  programId: string,
): IdlWithAddress | undefined {
  for (const network of Object.values(SolanaNetworks)) {
    const idls = loadIdls(network as SolanaNetworks);
    const found = idls.find((idl) => idl.programId === programId);
    if (found) {
      return found;
    }
  }
  return undefined;
}

/**
 * Get all program IDs from all networks
 */
export function getAllNetworkProgramIds(): Record<SolanaNetworks, string[]> {
  const result: Record<SolanaNetworks, string[]> = {
    [SolanaNetworks.Mainnet]: [],
    [SolanaNetworks.Devnet]: [],
  };

  for (const network of Object.values(SolanaNetworks)) {
    result[network as SolanaNetworks] = getAllProgramIds(
      network as SolanaNetworks,
    );
  }

  return result;
}
