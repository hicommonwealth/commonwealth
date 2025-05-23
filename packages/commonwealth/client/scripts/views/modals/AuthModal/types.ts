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

export type AuthOptionTypes = 'wallets' | 'sso';

export type AuthOptions = AuthWallets | AuthSSOs;

export type ModalVariantProps = {
  onClose: () => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccess?: (isNewAccount?: boolean, isUserFromWebView?: boolean) => any;
  showWalletsFor?:
    | ChainBase.Ethereum
    | ChainBase.CosmosSDK
    | ChainBase.Solana
    | ChainBase.Substrate
    | ChainBase.Sui;

  showAuthOptionFor?: AuthOptions;
  showAuthOptionTypesFor?: AuthOptionTypes[];
  onSignInClick?: () => void;
  triggerOpenEVMWalletsSubModal?: boolean;
  isUserFromWebView?: boolean;
};

export type ModalBaseProps = {
  layoutType: AuthModalType;
  bodyClassName?: string;
} & ModalVariantProps;

export type AuthModalProps = Pick<
  {
    isOpen: boolean;
    type?: AuthModalType;
    triggerOpenEVMWalletsSubModal?: boolean;
    isUserFromWebView?: boolean;
  } & ModalVariantProps,
  // only allow these props for external usage of <AuthModal/>
  | 'type'
  | 'isOpen'
  | 'onClose'
  | 'onSuccess'
  | 'showWalletsFor'
  | 'showAuthOptionFor'
  | 'showAuthOptionTypesFor'
  | 'triggerOpenEVMWalletsSubModal'
  | 'isUserFromWebView'
>;
