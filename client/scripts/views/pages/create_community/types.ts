export type ChainFormIdFields = {
  id?: string;
  name: string;
  symbol?: string;
};

export type ChainFormDefaultFields = {
  description: string;
  discord: string;
  element: string;
  github: string;
  icon_url: string;
  telegram: string;
  uploadInProgress: boolean;
  website: string;
};

export type ChainFormFields = ChainFormIdFields & ChainFormDefaultFields;

export type ChainFormState = {
  error?: string;
  loaded?: boolean;
  loading?: boolean;
  saving?: boolean;
  status?: string;
};

export type EthChainAttrs = {
  ethChains: { [id: number]: { url: string; alt_wallet_url: string } };
  ethChainNames: { [id: number]: string };
};

export type EthFormFields = {
  chain_string: string;
  eth_chain_id: string | number;
  node_url: string;
  alt_wallet_url: string;
  address: string;
};
