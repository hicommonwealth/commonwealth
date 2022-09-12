import { ValidationTextAttrs } from '../../components/component_kit/cw_validation_text';

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
  loaded?: boolean;
  loading?: boolean;
  saving?: boolean;
} & ValidationTextAttrs;

export type FunctionInfoState = {
  selectedFnIdx: number;
  fns: [];
  selectedFn: any;
}

export type FunctionListAttrs = {
  selectedFnIdx: number;
  fns: [];
  selectedFn: any;
}

export type ContractAttrs = {
  contract: { address: string, abi: string };
}

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
