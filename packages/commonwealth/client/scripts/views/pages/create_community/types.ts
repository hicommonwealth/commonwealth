import type {
  ValidationStatus,
  ValidationTextProps,
} from '../../components/component_kit/cw_validation_text';

export type CommunityFormIdFields = {
  id: string;
  name: string;
  communityName: string; // canonical identifer for chain that agrees with cosmos.directory
  symbol: string;
};

export type CommunityFormIdFieldSetters = {
  setId: React.Dispatch<React.SetStateAction<string>>;
  setName: React.Dispatch<React.SetStateAction<string>>;
  setCommunityName: React.Dispatch<React.SetStateAction<string>>;
  setSymbol: React.Dispatch<React.SetStateAction<string>>;
};

export type CommunityFormDefaultFields = {
  description: string;
  discord: string;
  element: string;
  github: string;
  iconUrl: string;
  telegram: string;
  uploadInProgress: boolean;
  website: string;
};

export type UseCommunityFormIdFieldsHookType = CommunityFormIdFields &
  CommunityFormIdFieldSetters;

export type CommunityFormDefaultFieldSetters = {
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  setDiscord: React.Dispatch<React.SetStateAction<string>>;
  setElement: React.Dispatch<React.SetStateAction<string>>;
  setGithub: React.Dispatch<React.SetStateAction<string>>;
  setIconUrl: React.Dispatch<React.SetStateAction<string>>;
  setTelegram: React.Dispatch<React.SetStateAction<string>>;
  setUploadInProgress: React.Dispatch<React.SetStateAction<boolean>>;
  setWebsite: React.Dispatch<React.SetStateAction<string>>;
};

export type UseCommunityFormDefaultFieldsHookType = CommunityFormDefaultFields &
  CommunityFormDefaultFieldSetters;

export type CommunityFormFields = CommunityFormIdFields &
  CommunityFormDefaultFields;

export type CommunityFormState = {
  loaded: boolean;
  loading: boolean;
  saving: boolean;
} & ValidationTextProps;

export type CommunityFormStateSetters = {
  setLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  setStatus: React.Dispatch<React.SetStateAction<ValidationStatus>>;
};

export type UseCommunityFormStateHookType = CommunityFormState &
  CommunityFormStateSetters;

export type EthChainNodeType = {
  [id: number]: { url: string; alt_wallet_url: string };
};

export type EthChainNodeNamesType = { [id: number]: string };

export type EthChainNodeFormState = {
  ethChainNodes: EthChainNodeType;
  ethChainNodeNames: EthChainNodeNamesType;
  disabled?: boolean;
};

export type EthChainNodeFormStateSetters = {
  setEthChainNodes: React.Dispatch<React.SetStateAction<EthChainNodeType>>;
  setEthChainNodeNames: React.Dispatch<
    React.SetStateAction<EthChainNodeNamesType>
  >;
};

export type UseEthChainNodeFormStateHookType = EthChainNodeFormState &
  EthChainNodeFormStateSetters;

export type EthFormFields = {
  address: string;
  altWalletUrl: string;
  chainName: string;
  ethChainId: string | number;
  nodeUrl: string;
};

export type EthFormFieldSetters = {
  setAddress: React.Dispatch<React.SetStateAction<string>>;
  setAltWalletUrl: React.Dispatch<React.SetStateAction<string>>;
  setChainName: React.Dispatch<React.SetStateAction<string>>;
  setEthChainId: React.Dispatch<React.SetStateAction<string | number>>;
  setNodeUrl: React.Dispatch<React.SetStateAction<string>>;
};

export type UseEthCommunityFormFieldsHookType = EthFormFields &
  EthFormFieldSetters;
