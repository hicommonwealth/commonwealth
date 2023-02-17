import type { ChainNetwork } from 'common-common/src/types';
import type {
  ValidationStatus,
  ValidationTextProps,
} from '../../components/component_kit/cw_validation_text';

export type ChainFormIdFields = {
  id: string;
  name: string;
  symbol?: string;
};

export type ChainFormIdFieldSetters = {
  setId: React.Dispatch<React.SetStateAction<string>>;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setSymbol: React.Dispatch<React.SetStateAction<string>>;
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

export type UseChainFormIdFieldsHookType = ChainFormIdFields &
  ChainFormIdFieldSetters;

export type ChainFormDefaultFieldSetters = {
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setDiscord: React.Dispatch<React.SetStateAction<string>>;
  setElement: React.Dispatch<React.SetStateAction<string>>;
  setGithub: React.Dispatch<React.SetStateAction<string>>;
  setIconUrl: React.Dispatch<React.SetStateAction<string>>;
  setTelegram: React.Dispatch<React.SetStateAction<string>>;
  setUploadInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  setWebsite: React.Dispatch<React.SetStateAction<string>>;
};

export type UseChainFormDefaultFieldsHookType = ChainFormDefaultFields &
  ChainFormDefaultFieldSetters;

export type ChainFormFields = ChainFormIdFields & ChainFormDefaultFields;

export type ChainFormState = {
  loaded?: boolean;
  loading?: boolean;
  saving?: boolean;
} & ValidationTextProps;

export type ChainFormStateSetters = {
  setLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  setStatus: React.Dispatch<React.SetStateAction<ValidationStatus>>;
};

export type UseChainFormStateHookType = ChainFormState & ChainFormStateSetters;

export type EthChainsType = {
  [id: number]: { url: string; alt_wallet_url: string };
};

export type EthChainNamesType = { [id: number]: string };

export type EthChainAttrs = {
  ethChains: EthChainsType;
  ethChainNames: EthChainNamesType;
};

export type EthFormFields = {
  address?: string;
  altWalletUrl?: string;
  chainString?: string;
  ethChainId?: string | number;
  nodeUrl?: string;
};

export type EthDaoFormFields = {
  network: ChainNetwork.Ethereum;
  tokenName: string;
};

export type CreateFactoryEthDaoForm = ChainFormFields &
  EthFormFields &
  EthDaoFormFields;
