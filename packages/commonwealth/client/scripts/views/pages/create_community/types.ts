import type { ChainNetwork } from 'common-common/src/types';
import type { ValidationTextProps } from '../../components/component_kit/cw_validation_text';

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
} & ValidationTextProps;

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
