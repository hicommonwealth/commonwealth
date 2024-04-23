import { ChainBase } from '@hicommonwealth/shared';
import { ReactNode } from 'react';
import { AuthSSOs, AuthWallets } from '../../components/AuthButton/types';

export type ModalBaseTabs = {
  name: string;
  options: AuthWallets[] | AuthSSOs[];
};

export type ModalVariantProps = {
  onClose: () => any;
  onSuccess?: (isNewAccount?: boolean) => any;
  showWalletsFor?:
    | ChainBase.Ethereum
    | ChainBase.CosmosSDK
    | ChainBase.Solana
    | ChainBase.Substrate;
};

export type ModalBaseProps = {
  layoutType: 'create-account' | 'sign-in';
  hideDescription?: boolean;
  customBody?: ReactNode;
  showAuthenticationOptionsFor?: ('wallets' | 'sso')[];
  bodyClassName?: string;
  onSignInClick?: () => void;
} & ModalVariantProps;

export type AuthModalProps = {
  isOpen: boolean;
  type?: 'create-account' | 'sign-in';
} & ModalVariantProps;
