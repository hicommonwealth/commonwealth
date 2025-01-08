import { ChainBase } from '@hicommonwealth/shared';
import { AuthSSOs, AuthWallets } from '../../components/AuthButton/types';

export enum AuthModalType {
  CreateAccount = 'create-account',
  SignIn = 'sign-in',
  RevalidateSession = 'revalidate-session',
}

export type ModalBaseTabs = {
  name: string;
  options: AuthWallets[] | AuthSSOs[];
};

export type ModalVariantProps = {
  onClose: () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (isNewAccount?: boolean, isFromWebView?: boolean) => any;
  showWalletsFor?:
    | ChainBase.Ethereum
    | ChainBase.CosmosSDK
    | ChainBase.Solana
    | ChainBase.Substrate;

  showAuthOptionFor?: AuthWallets | AuthSSOs;
  onSignInClick?: () => void;
  openEVMWalletsSubModal?: boolean;
  isUserFromWebView?: boolean;
};

export type ModalBaseProps = {
  layoutType: AuthModalType;
  showAuthOptionTypesFor?: ('wallets' | 'sso')[];
  bodyClassName?: string;
} & ModalVariantProps;

export type AuthModalProps = Pick<
  {
    isOpen: boolean;
    type?: AuthModalType;
    openEVMWalletsSubModal?: boolean;
    isUserFromWebView?: boolean;
  } & ModalVariantProps,
  // only allow these props for external usage of <AuthModal/>
  | 'type'
  | 'isOpen'
  | 'onClose'
  | 'onSuccess'
  | 'showWalletsFor'
  | 'openEVMWalletsSubModal'
  | 'isUserFromWebView'
>;
