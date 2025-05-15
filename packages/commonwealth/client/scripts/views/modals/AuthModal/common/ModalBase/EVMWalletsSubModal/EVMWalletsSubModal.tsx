import usePrefersColorScheme from 'client/scripts/hooks/useColorScheme';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import clsx from 'clsx';
import React from 'react';
import { Link } from 'react-router-dom';
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
  isUserFromWebView?: boolean;
  handleNextOrSkip?: (
    address?: string | null | undefined,
    isNewlyCreated?: boolean,
    isUserFromWebView?: boolean,
  ) => Promise<void>;
};

const EVMWalletsSubModal = ({
  isOpen,
  onClose,
  disabled,
  availableWallets,
  onWalletSelect,
  canResetWalletConnect,
  onResetWalletConnect,
  isUserFromWebView,
  handleNextOrSkip,
}: EVMWalletsSubModalProps) => {
  const isLightMode = usePrefersColorScheme();
  return (
    <CWModal
      rootClassName={clsx(
        'EVMWalletsSubModal',
        isUserFromWebView ? 'forMobile' : '',
      )}
      open={isOpen}
      onClose={onClose}
      className={clsx(isUserFromWebView ? 'forMobile' : '')}
      content={
        <section
          className={clsx('container', isUserFromWebView ? 'forMobile' : '')}
        >
          <div className="header">
            <CWText type="h3" className="header" isCentered>
              Connect Wallet
            </CWText>
            <CWIcon iconName="close" onClick={onClose} />
          </div>

          <section
            className={clsx(
              'evm-wallet-list',
              isUserFromWebView ? 'forMobile' : '',
            )}
          >
            {/* @ts-expect-error StrictNullChecks*/}
            {availableWallets.map((wallet) => (
              <React.Fragment key={wallet}>
                <AuthButton
                  type={wallet}
                  rounded
                  variant={
                    isUserFromWebView ? 'light' : isLightMode ? 'light' : 'dark'
                  }
                  showDescription={wallet === 'okx'}
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
          {isUserFromWebView && (
            <>
              <CWText isCentered className="footer">
                We will never share your contact information with third-party
                services.
                <br />
                For questions, please review our&nbsp;
                <Link to="/privacy">Privacy Policy</Link>
              </CWText>
              <div className="buttons_container">
                <CWButton
                  label="Skip"
                  buttonWidth="wide"
                  containerClassName="skip-button"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={() =>
                    handleNextOrSkip?.(null, false, true).catch(console.error)
                  }
                />
                <CWButton
                  label="Next"
                  buttonWidth="wide"
                  // eslint-disable-next-line @typescript-eslint/no-misused-promises
                  onClick={() =>
                    handleNextOrSkip?.(null, false, true).catch(console.error)
                  }
                  containerClassName="next-button"
                />
              </div>
            </>
          )}
        </section>
      }
    />
  );
};

export { EVMWalletsSubModal };
