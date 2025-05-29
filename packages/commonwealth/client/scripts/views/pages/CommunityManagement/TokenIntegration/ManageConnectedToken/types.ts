import { GetTokenMetadataResponse } from 'state/api/tokens/getTokenMetadata';

export type ManageConnectedTokenProps = {
  tokenInfo?: Pick<
    GetTokenMetadataResponse,
    'name' | 'symbol' | 'logo' | 'decimals'
  >;
  pinnedToken?: {
    contract_address: string;
    ChainNode?: {
      name: string;
      eth_chain_id?: number | null;
    };
  };
  isLoadingToken: boolean;
};
