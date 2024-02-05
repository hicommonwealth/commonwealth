import React from 'react';
import AuthButton from 'views/components/AuthButton';
import { EVMWallets } from 'views/components/AuthButton/types';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWIcon } from '../../../components/component_kit/cw_icons/cw_icon';
import { CWModal } from '../../../components/component_kit/new_designs/CWModal';
import './EVMWalletsSubModal.scss';

type EVMWalletsSubModalProps = {
  isOpen: boolean;
  onClose: () => any;
  disabled?: boolean;
  availableWallets?: EVMWallets[];
  onWalletSelect?: (wallet: EVMWallets) => any;
};

const EVMWalletsSubModal = ({
  isOpen,
  onClose,
  disabled,
  availableWallets,
  onWalletSelect,
}: EVMWalletsSubModalProps) => {
  return (
    <CWModal
      rootClassName="EVMWalletsSubModal"
      open={isOpen}
      onClose={onClose}
      content={
        <section className="container">
          <div className="header">
            <CWIcon iconName="help" />
            <CWText type="h3" className="header" isCentered>
              Connect Wallet
            </CWText>
            <CWIcon iconName="close" onClick={onClose} />
          </div>

          <section className="evm-wallet-list">
            {availableWallets.map((wallet) => (
              <AuthButton
                key={wallet}
                type={wallet}
                rounded
                variant="dark"
                showDescription={false}
                onClick={async () => await onWalletSelect(wallet)}
                disabled={disabled}
              />
            ))}
          </section>
        </section>
      }
    />
  );
};

export { EVMWalletsSubModal };
