import { ChainBase } from '@hicommonwealth/shared';
import { ReactNode } from 'react';
import { AuthSSOs, AuthWallets } from '../../components/AuthButton/types';

export enum AuthModalType {
  AccountTypeGuidance = 'auth-type-guidance',
  CreateAccount = 'create-account',
  SignIn = 'sign-in',
}

export type ModalBaseTabs = {
  name: string;
  options: AuthWallets[] | AuthSSOs[];
};

export type ModalVariantProps = {
  onClose: () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (isNewAccount?: boolean) => any;
  showWalletsFor?:
    | ChainBase.Ethereum
    | ChainBase.CosmosSDK
    | ChainBase.Solana
    | ChainBase.Substrate;
  onSignInClick?: () => void;
  onChangeModalType?: (type: AuthModalType) => void;
};

export type ModalBaseProps = {
  layoutType: AuthModalType;
  hideDescription?: boolean;
  customBody?: ReactNode;
  showAuthenticationOptionsFor?: ('wallets' | 'sso')[];
  bodyClassName?: string;
} & ModalVariantProps;

export type AuthModalProps = {
  isOpen: boolean;
  type?: AuthModalType;
} & ModalVariantProps;
