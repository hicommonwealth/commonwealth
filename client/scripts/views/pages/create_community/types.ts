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
  iconUrl: string;
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
  address?: string;
  altWalletUrl?: string;
  chainString?: string;
  ethChainId?: string | number;
  nodeUrl?: string;
};
