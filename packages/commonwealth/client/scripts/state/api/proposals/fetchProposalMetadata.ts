import { useQuery } from '@tanstack/react-query';
import * as isIPFS from 'is-ipfs';
import axios from 'axios';

import app from 'state';
import { ChainBase } from 'common-common/src/types';
import { AnyProposal } from 'models/types';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';

const PROPOSAL_METADATA_CACHE_TIME = Infinity;
const PROPOSAL_METADATA_STALE_TIME = 1000 * 60 * 30; // onchain metadata URI does not change, but the file it points to might

const fetchProposalMetadata = async (proposal: AnyProposal): Promise<any> => {
  if (proposal instanceof CosmosProposalV1 && !!proposal?.data?.metadata) {
    const fileURI = proposal.data.metadata.replace('ipfs://', '');
    const isIPFSFile = isIPFS.cid(fileURI);

    if (!isIPFSFile) {
      // TODO: fetch non-ipfs files. https://github.com/hicommonwealth/commonwealth/issues/4233
      console.error(
        `Non-IPFS metadata fetching is not yet implemented. Did not fetch ${fileURI}.`
      );
      return {};
    }

    const metadataUri = `${app.serverUrl()}/ipfsProxy?hash=${fileURI}`;
    let metadataObj;

    return axios
      .get(metadataUri)
      .then((response) => {
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
      })
      .catch(() => {
        console.error(`Failed to fetch metadata with URI: ${fileURI}`);
        return {};
      });
  }
  return {};
};

const useProposalMetadataQuery = (proposal: AnyProposal) => {
  const isCosmosV1 = proposal instanceof CosmosProposalV1;
  const chainId = app.activeChainId();
  const proposalId = proposal?.identifier;
  return useQuery({
    queryKey: ['proposalMetadata', chainId, proposalId],
    queryFn: () => fetchProposalMetadata(proposal),
    enabled:
      app.chain?.base === ChainBase.CosmosSDK && isCosmosV1 && !!proposalId,
    cacheTime: PROPOSAL_METADATA_CACHE_TIME,
    staleTime: PROPOSAL_METADATA_STALE_TIME,
  });
};

export { useProposalMetadataQuery };
