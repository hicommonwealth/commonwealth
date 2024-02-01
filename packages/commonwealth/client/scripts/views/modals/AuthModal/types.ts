import { ChainBase } from '@hicommonwealth/core';
import { AuthSSOs, AuthWallets } from '../../components/AuthButton/types';

export type AuthModalTabs = {
  name: string;
  options: AuthWallets[] | AuthSSOs[];
};

export type AuthModalProps = {
  isOpen: boolean;
  onClose: () => any;
  onSuccess?: () => any;
  showWalletsFor?: ChainBase;
};
