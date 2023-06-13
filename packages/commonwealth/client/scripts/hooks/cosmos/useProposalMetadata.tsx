import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import * as isIPFS from 'is-ipfs';
import { IApp } from 'state';
import type { AnyProposal } from 'models/types';
import { CosmosProposalV1 } from 'controllers/chain/cosmos/gov/v1/proposal-v1';

interface Props {
  app: IApp;
  proposal: AnyProposal;
}

interface Response {
  metadata: any;
}

export const useProposalMetadata = ({ app, proposal }: Props): Response => {
  const [metadata, setMetadata] = useState();
  const hasFetchedDataRef = useRef(false);

  useEffect(() => {
    if (
      proposal instanceof CosmosProposalV1 &&
      proposal?.data?.metadata &&
      !hasFetchedDataRef.current &&
      !proposal.data.title // TODO: remove this check if we want to show all metadata.
      //See https://github.com/hicommonwealth/commonwealth/issues/4187
    ) {
      const fileURI = proposal.data.metadata.replace('ipfs://', '');
      const isIPFSFile = isIPFS.cid(fileURI);

      if (!isIPFSFile) {
        // TODO: fetch non-ipfs files. https://github.com/hicommonwealth/commonwealth/issues/4233
        console.error(
          `Non-IPFS metadata fetching is not yet implemented. Did not fetch ${fileURI}.`
        );
        return;
      }

      const metadataUri = `${app.serverUrl()}/ipfsProxy?hash=${fileURI}`;
      let metadataObj;
      hasFetchedDataRef.current = true;

      axios
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
          setMetadata(metadataObj); // trigger re-render
        })
        .catch(() => {
          console.error(`Failed to fetch metadata with ${fileURI}`);
        });
    }
  }, [proposal, app]);

  return { metadata };
};
