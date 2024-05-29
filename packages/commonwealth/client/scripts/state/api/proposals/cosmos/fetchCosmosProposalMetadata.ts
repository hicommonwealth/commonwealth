import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import * as isIPFS from 'is-ipfs';

import { ChainBase } from '@hicommonwealth/shared';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';
import { AnyProposal } from 'models/types';
import app from 'state';

const PROPOSAL_METADATA_CACHE_TIME = Infinity;
// onchain metadata URI does not change, but the file it points to might:
const PROPOSAL_METADATA_STALE_TIME = 1000 * 60 * 30;

const fetchCosmosProposalMetadata = async (
  proposal: AnyProposal,
): Promise<any> => {
  if (proposal instanceof CosmosProposalV1 && !!proposal?.data?.metadata) {
    const fileURI = proposal.data.metadata.replace('ipfs://', '');
    const isIPFSFile = isIPFS.cid(fileURI);

    if (!isIPFSFile) {
      // TODO: fetch non-ipfs files. https://github.com/hicommonwealth/commonwealth/issues/4233
      return {};
    }

    const metadataUri = `${app.serverUrl()}/ipfsProxy?hash=${fileURI}`;
    let metadataObj;

    return axios.get(metadataUri).then((response) => {
      const { data } = response;
      if (typeof data === 'string') {
        metadataObj = JSON.parse(data);
      } else if (typeof data === 'object') {
        metadataObj = data;
      } else {
        throw new Error('Invalid metadata format');
      }

      proposal.updateMetadata(metadataObj); // update store
      return metadataObj;
    });
  }
  return {};
};

const getCosmosProposalMetadataQueryKey = (proposal: AnyProposal) => {
  return ['cosmosProposalMetadata', app.activeChainId(), proposal?.identifier];
};

const useCosmosProposalMetadataQuery = (proposal: AnyProposal) => {
  const isCosmosV1 = proposal instanceof CosmosProposalV1;
  const proposalId = proposal?.identifier;
  return useQuery({
    queryKey: getCosmosProposalMetadataQueryKey(proposal),
    queryFn: () => fetchCosmosProposalMetadata(proposal),
    enabled:
      app.chain?.base === ChainBase.CosmosSDK && isCosmosV1 && !!proposalId,
    cacheTime: PROPOSAL_METADATA_CACHE_TIME,
    staleTime: PROPOSAL_METADATA_STALE_TIME,
  });
};

export { useCosmosProposalMetadataQuery };
