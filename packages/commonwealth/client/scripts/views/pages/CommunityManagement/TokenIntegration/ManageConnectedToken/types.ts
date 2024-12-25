import { GetTokenMetadataResponse } from 'state/api/tokens/getTokenMetadata';

export type ManageConnectedTokenProps = {
  tokenInfo?: GetTokenMetadataResponse;
  isLoadingToken: boolean;
};
