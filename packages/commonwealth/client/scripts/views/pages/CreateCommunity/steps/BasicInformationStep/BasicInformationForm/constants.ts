import { commonProtocol } from '@hicommonwealth/shared';
import NodeInfo from 'models/NodeInfo';
import app from 'state';

// used for default chain dropdown options
export const POLYGON_ETH_CHAIN_ID = 137;
export const ETHEREUM_MAINNET_ID = '1';
export const BASE_ID = '8453';
export const OSMOSIS_ID = 'osmosis';
export const BLAST_ID = '81457';

export const existingCommunityIds = app.config.chains
  .getAll()
  .map((community) => community.id);

const removeTestCosmosNodes = (nodeInfo: NodeInfo): boolean => {
  return !(
    window.location.hostname.includes('commonwealth.im') &&
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

  return (
    removeTestCosmosNodes(nodeInfo) &&
    (isEth || isCosmos || isSolana || isPolygon)
  );
};

const chainIdsWithStakeEnabled = Object.values(
  commonProtocol.factoryContracts,
).map((c) => c.chainId);

// Get chain id's from the app.config.chains for all eth and cosmos chains
export const chainTypes = app.config.nodes
  .getAll()
  .filter(particularChainNodes)
  .map((chain) => ({
    chainBase: chain.ethChainId
      ? 'ethereum'
      : chain.cosmosChainId
      ? 'cosmos'
      : 'solana',
    altWalletUrl: chain.altWalletUrl,
    nodeUrl: chain.url,
    value: chain.ethChainId || chain.cosmosChainId || 'solana',
    label: chain.name.replace(/\b\w/g, (l) => l.toUpperCase()),
    bech32Prefix: chain.bech32,
    hasStakeEnabled: chainIdsWithStakeEnabled.includes(chain.ethChainId),
  }));

// Sort chains alphabetically by labels
export const alphabeticallySortedChains = [...chainTypes].sort((a, b) =>
  (a?.label || '').toLowerCase().localeCompare(b?.label || ''),
);

// Sort chains by stake, chains having stake enabled will come first
export const alphabeticallyStakeWiseSortedChains =
  alphabeticallySortedChains.sort((a) => (a.hasStakeEnabled ? -1 : 0));
