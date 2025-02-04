import usePrefersColorScheme from 'client/scripts/hooks/useColorScheme';
import React from 'react';
import AuthButton from 'views/components/AuthButton';
import { EVMWallets } from 'views/components/AuthButton/types';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWIcon } from '../../../../../components/component_kit/cw_icons/cw_icon';
import { CWModal } from '../../../../../components/component_kit/new_designs/CWModal';
import './EVMWalletsSubModal.scss';

type EVMWalletsSubModalProps = {
  isOpen: boolean;
  onClose: () => void;
  disabled?: boolean;
  availableWallets?: EVMWallets[];
  onWalletSelect?: (wallet: EVMWallets) => void;
  canResetWalletConnect?: boolean;
  onResetWalletConnect?: () => void;
};

const EVMWalletsSubModal = ({
  isOpen,
  onClose,
  disabled,
  availableWallets,
  onWalletSelect,
  canResetWalletConnect,
  onResetWalletConnect,
}: EVMWalletsSubModalProps) => {
  const isLightMode = usePrefersColorScheme();
  return (
    <CWModal
      rootClassName="EVMWalletsSubModal"
      open={isOpen}
      onClose={onClose}
      content={
        <section className="container">
          <div className="header">
            <CWText type="h3" className="header" isCentered>
              Connect Wallet
            </CWText>
            <CWIcon iconName="close" onClick={onClose} />
          </div>

          <section className="evm-wallet-list">
            {/* @ts-expect-error StrictNullChecks*/}
            {availableWallets.map((wallet) => (
              <React.Fragment key={wallet}>
                <AuthButton
                  type={wallet}
                  rounded
                  variant={isLightMode ? 'light' : 'dark'}
                  showDescription={false}
                  // @ts-expect-error <StrictNullChecks/>
                  onClick={() => onWalletSelect(wallet)}
                  disabled={disabled}
                />
                {/* Show reset button for wallet connect, if its auth flow session is active */}
                {wallet === 'walletconnect' && canResetWalletConnect && (
                  <button
                    className="wallet-connect-reset-btn"
                    onClick={onResetWalletConnect}
                  >
                    Reset WalletConnect
                  </button>
                )}
              </React.Fragment>
            ))}
          </section>
        </section>
      }
    />
  );
};

export { EVMWalletsSubModal };
