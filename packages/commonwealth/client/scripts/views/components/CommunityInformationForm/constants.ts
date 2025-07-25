import { factoryContracts, ValidChains } from '@hicommonwealth/evm-protocols';
import { PRODUCTION_DOMAIN } from '@hicommonwealth/shared';
import NodeInfo from 'models/NodeInfo';
import { fetchCachedNodes } from 'state/api/nodes';

// used for default chain dropdown options
export const POLYGON_ETH_CHAIN_ID = 137;
export const ETHEREUM_MAINNET_ID = '1';
export const BASE_ID = '8453';
export const OSMOSIS_ID = 'osmosis';
export const BLAST_ID = '81457';
export const SKALE_ID = '974399131';
export const SONEIUM_ID = '1868';

const removeTestCosmosNodes = (nodeInfo: NodeInfo): boolean => {
  return !(
    window.location.hostname.includes(PRODUCTION_DOMAIN) &&
    [
      'evmosdevci',
      'csdkv1',
      'csdkbeta',
      'csdkv1ci',
      'csdkbetaci',
      'evmosdev',
    ].includes(String(nodeInfo.cosmosChainId))
  );
};

const particularChainNodes = (nodeInfo: NodeInfo) => {
  const isEth = nodeInfo.ethChainId;
  const isCosmos = nodeInfo.cosmosChainId;
  const isSolana =
    nodeInfo.balanceType === 'solana' &&
    nodeInfo.name.toLowerCase().includes('mainnet');
  const isPolygon = nodeInfo.ethChainId === POLYGON_ETH_CHAIN_ID;
  const isSui = nodeInfo.balanceType === 'sui';

  return (
    removeTestCosmosNodes(nodeInfo) &&
    (isEth || isCosmos || isSolana || isPolygon || isSui)
  );
};

export const chainIdsWithStakeEnabled = Object.values(factoryContracts)
  // we don't support stake on Blast anymore as of 23 Sept, 2024 (#9196)
  .filter((chain) => chain.chainId !== ValidChains.Blast)
  .map((c) => c.chainId);

// Get chain id's from the fetchCachedNodes for all eth, cosmos, and sui chains
export const chainTypes =
  fetchCachedNodes()
    ?.filter(particularChainNodes)
    ?.map((chain) => {
      const result = {
        id: chain.id,
        chainBase: chain.ethChainId
          ? 'ethereum'
          : chain.cosmosChainId
            ? 'cosmos'
            : chain.balanceType === 'sui'
              ? 'sui'
              : 'solana',
        altWalletUrl: chain.altWalletUrl,
        nodeUrl: chain.url,
        value:
          chain.ethChainId ||
          chain.cosmosChainId ||
          (chain.balanceType === 'sui' ? `sui-${chain.id}` : 'solana'),
        label: chain.name.replace(/\b\w/g, (l) => l.toUpperCase()),
        bech32Prefix: chain.bech32,
        // @ts-expect-error StrictNullChecks
        hasStakeEnabled: chainIdsWithStakeEnabled.includes(chain.ethChainId),
        chainNodeId: chain.id,
        ethChainId: chain.ethChainId,
        alchemyMetadata: chain.alchemyMetadata,
      };

      return result;
    }) || [];

// Sort chains alphabetically by labels
export const alphabeticallySortedChains = [...(chainTypes || [])].sort((a, b) =>
  (b?.label || '').toLowerCase().localeCompare(a?.label || ''),
);

// Sort chains by stake, chains having stake enabled will come first
export const alphabeticallyStakeWiseSortedChains =
  alphabeticallySortedChains.sort((a) => (a.hasStakeEnabled ? -1 : 0));
