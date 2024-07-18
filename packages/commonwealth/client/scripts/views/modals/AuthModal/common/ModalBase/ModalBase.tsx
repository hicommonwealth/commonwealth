import { ChainBase, WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import commonLogo from 'assets/img/branding/common-logo.svg';
import clsx from 'clsx';
import React, { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import useAuthModalStore from 'state/ui/modals/authModal';
import AuthButton from 'views/components/AuthButton';
import {
  AuthTypes,
  AuthWallets,
  EVMWallets,
} from 'views/components/AuthButton/types';
import {
  CWTab,
  CWTabsRow,
} from 'views/components/component_kit/new_designs/CWTabs';
import { CWIcon } from '../../../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../../../components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
} from '../../../../components/component_kit/new_designs/CWModal';
import { AuthModalType, ModalBaseProps, ModalBaseTabs } from '../../types';
import useAuthentication from '../../useAuthentication';
import { EVMWalletsSubModal } from './EVMWalletsSubModal';
import { EmailForm } from './EmailForm';
import { MobileWalletConfirmationSubModal } from './MobileWalletConfirmationSubModal';
import './ModalBase.scss';

const MODAL_COPY = {
  [AuthModalType.AccountTypeGuidance]: {
    title: '',
    description: `We don't recognize the address you're trying to sign in with. \nWould you like to:`,
    showFooter: false,
    showExistingAccountSignInFooter: false,
  },
  [AuthModalType.CreateAccount]: {
    title: 'Create account',
    description: `Common is built on web3 technology that utilizes wallets. \nHow would you like to sign up?`,
    showFooter: true,
    showExistingAccountSignInFooter: true,
  },
  [AuthModalType.SignIn]: {
    title: 'Sign into Common',
    description: '',
    showFooter: true,
    showExistingAccountSignInFooter: false,
  },
};

/**
 * AuthModal base component with customizable options, callbacks, layouts and auth options display strategy.
 * @param onClose callback triggered when the modal is closed or user is authenticated.
 * @param onSuccess callback triggered on successful user authentication.
 * @param layoutType specifies the layout type/variant of the modal.
 * @param hideDescription if `true`, hides the description after modal header.
 * @param customBody custom content to add before the modal body.
 * @param showAuthenticationOptionsFor determines auth options category ('wallets', 'sso', or both) to display.
 *                                     All options are displayed if prop is not provided.
 *                                     Prop is ignored if internal modal state hides SSO options.
 * @param showWalletsFor specifies wallets to display for the specified chain.
 * @param bodyClassName custom class to apply to the modal body.
 * @param onSignInClick callback triggered when the user clicks on the `Sign in` link in the modal footer.
 * @param onChangeModalType callback triggered when `layoutType` change is requested from within the modal.
 * @returns {ReactNode}
 */
const ModalBase = ({
  onClose,
  onSuccess,
  layoutType,
  hideDescription,
  customBody,
  showAuthenticationOptionsFor,
  showWalletsFor,
  bodyClassName,
  onSignInClick,
  onChangeModalType,
}: ModalBaseProps) => {
  const copy = MODAL_COPY[layoutType];

  const [activeTabIndex, setActiveTabIndex] = useState<number>(
    showAuthenticationOptionsFor?.includes('sso') &&
      showAuthenticationOptionsFor.length === 1
      ? 1
      : 0,
  );
  const [isEVMWalletsModalVisible, setIsEVMWalletsModalVisible] =
    useState(false);
  const [isAuthenticatingWithEmail, setIsAuthenticatingWithEmail] =
    useState(false);

  const handleClose = async () => {
    setIsAuthenticatingWithEmail(false);
    setIsEVMWalletsModalVisible(false);
    isWalletConnectEnabled &&
      (await onResetWalletConnect().catch(console.error));
    await onClose();
  };

  const handleSuccess = async (_, isNewlyCreated) => {
    await onSuccess?.(isNewlyCreated);
    await handleClose();
  };

  const handleUnrecognizedAddressReceived = () => {
    // if this is the `layoutType == SignIn` modal, and we get an unrecognized
    // address, then change modal type to `AccountTypeGuidance`
    if (layoutType === AuthModalType.SignIn) {
      // @ts-expect-error <StrictNullChecks/>
      onChangeModalType(AuthModalType.AccountTypeGuidance);
      return false;
    }

    return true;
  };

  const { setShouldOpenGuidanceModalAfterMagicSSORedirect } =
    useAuthModalStore();

  const {
    wallets = [],
    isMagicLoading,
    isWalletConnectEnabled,
    isMobileWalletVerificationStep,
    onResetWalletConnect,
    onEmailLogin,
    onWalletSelect,
    onSocialLogin,
    onVerifyMobileWalletSignature,
  } = useAuthentication({
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onModalClose: handleClose,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onSuccess: handleSuccess,
    onUnrecognizedAddressReceived: handleUnrecognizedAddressReceived,
  });

  const filterWalletNames = (byChain: ChainBase) =>
    wallets
      .filter((wallet) => wallet.chain === byChain)
      .map((wallet) => wallet.name);
  const findWalletById = (walletId: WalletId) =>
    wallets.find((wallet) => wallet.name === walletId);

  const hasWalletConnect = findWalletById(WalletId.WalletConnect);
  const evmWallets = filterWalletNames(ChainBase.Ethereum) as EVMWallets[];
  const cosmosWallets = filterWalletNames(ChainBase.CosmosSDK);
  const solanaWallets = filterWalletNames(ChainBase.Solana);
  const substrateWallets = filterWalletNames(ChainBase.Substrate);

  const getWalletNames = () => {
    // Wallet Display Logic:
    // 1. When `showWalletsFor` is present, show wallets for that specific chain only.
    // 2. On communities based on `Ethereum`, `Cosmos`, `Solana`, or `Substrate`chains:
    //    - Display wallets specific to the respective community chain.
    // 3. On non-community pages, show `Ethereum`, `Cosmos`, `Solana`, and `Substrate` based wallets
    // 4. On specific communities, show specific wallets
    //    a. On `terra` community, only show `terrastation` and `terra-walletconnect` (wallet connect for terra) wallets
    //    b. On `evmos` and `injective` communities, only show `cosm-metamask` (metamask for cosmos communities) and
    //       `keplr-ethereum` (keplr for ethereum communities) wallets

    const showWalletsForSpecificChains = showWalletsFor || app?.chain?.base;
    if (showWalletsForSpecificChains) {
      switch (showWalletsForSpecificChains) {
        case ChainBase.Ethereum:
          return hasWalletConnect ? ['walletconnect'] : [];
        case ChainBase.CosmosSDK:
          return cosmosWallets;
        case ChainBase.Solana:
          return solanaWallets;
        case ChainBase.Substrate:
          return substrateWallets;
        default:
          return [];
      }
    }

    if (!app?.chain?.base) {
      return [
        ...(hasWalletConnect ? ['walletconnect'] : []),
        ...cosmosWallets,
        ...solanaWallets,
        ...substrateWallets,
      ];
    }

    return [];
  };

  const shouldShowSSOOptions = (() => {
    // All auth options lead to either an `Ethereum` or `Cosmos` address once user authenticates.
    // SSO Display Logic:
    // 1. When `showWalletsFor` is either `Ethereum` or `Cosmos`, show all SSO options.
    // 2. On communities based on `Ethereum` or `Cosmos`, show all SSO options.
    // 3. On unscoped pages, show all SSO options.
    // 4. In all other cases, hide all SSO options.
    const showSSOOptionsForSpecificChains = showWalletsFor || app?.chain?.base;
    if (showSSOOptionsForSpecificChains) {
      switch (showSSOOptionsForSpecificChains) {
        case ChainBase.Ethereum:
        case ChainBase.CosmosSDK:
          return true;
        default:
          return false;
      }
    }

    return true;
  })();

  const tabsList: ModalBaseTabs[] = [
    {
      name: 'Wallet',
      options: getWalletNames() as AuthWallets[],
    },
    {
      name: 'Email or Social',
      options: ['google', 'discord', 'x', 'apple', 'github', 'email'],
    },
  ];

  useEffect(() => {
    setActiveTabIndex((prevActiveTab) => {
      if (!shouldShowSSOOptions && prevActiveTab === 1) return 0;

      if (
        (showAuthenticationOptionsFor?.includes('sso') &&
          showAuthenticationOptionsFor.length === 1) ||
        prevActiveTab === 1
      ) {
        return 1;
      }

      return 0;
    });
  }, [showAuthenticationOptionsFor, shouldShowSSOOptions]);

  const onAuthMethodSelect = async (option: AuthTypes) => {
    if (option === 'email') {
      if (layoutType === AuthModalType.SignIn) {
        setShouldOpenGuidanceModalAfterMagicSSORedirect(true);
      }

      setIsAuthenticatingWithEmail(true);
      return;
    }

    // if any wallet option is selected
    if (activeTabIndex === 0) {
      // if wallet connect option is selected, open the EVM wallet list modal
      if (option === 'walletconnect' && !isEVMWalletsModalVisible) {
        setIsEVMWalletsModalVisible(true);
        return;
      }

      // @ts-expect-error <StrictNullChecks>
      await onWalletSelect(wallets.find((wallet) => wallet.name === option));
    }

    // if any SSO option is selected
    if (activeTabIndex === 1) {
      if (layoutType === AuthModalType.SignIn) {
        setShouldOpenGuidanceModalAfterMagicSSORedirect(true);
      }

      // TODO: decide if twitter references are to be updated to 'x'
      await onSocialLogin(
        option === 'x' ? WalletSsoSource.Twitter : (option as WalletSsoSource),
      );
    }
  };

  return (
    <>
      <section className="ModalBase">
        <CWIcon iconName="close" onClick={onClose} className="close-btn" />

        <img src={commonLogo} className="logo" />

        <CWText type="h2" className="header" isCentered>
          {copy.title}
        </CWText>

        {copy.description && !hideDescription && (
          <CWText type="b1" className="description" isCentered>
            {...copy.description.split('\n').map((line, index) => (
              <Fragment key={index}>
                {line}
                <br />
              </Fragment>
            ))}
          </CWText>
        )}

        <CWModalBody className={clsx('content', bodyClassName)}>
          {customBody}

          {/* @ts-expect-error StrictNullChecks*/}
          {showAuthenticationOptionsFor?.length > 0 && (
            <>
              {shouldShowSSOOptions &&
                // @ts-expect-error StrictNullChecks*
                showAuthenticationOptionsFor?.length > 1 && (
                  <CWTabsRow className="tabs">
                    {tabsList.map((tab, index) => (
                      <CWTab
                        key={tab.name}
                        label={tab.name}
                        isDisabled={isMagicLoading}
                        isSelected={tabsList[activeTabIndex].name === tab.name}
                        onClick={() => setActiveTabIndex(index)}
                      />
                    ))}
                  </CWTabsRow>
                )}

              <section className="auth-options">
                {/* On the wallets tab, if no wallet is found, show "No wallets Found" */}
                {activeTabIndex === 0 &&
                  tabsList[activeTabIndex].options.length === 0 && (
                    <AuthButton type="NO_WALLETS_FOUND" />
                  )}

                {/*
                  If email option is selected don't render SSO's list,
                  else render wallets/SSO's list based on activeTabIndex
                */}
                {(activeTabIndex === 0 ||
                  (activeTabIndex === 1 && !isAuthenticatingWithEmail)) &&
                  tabsList[activeTabIndex].options.map((option, key) => (
                    <AuthButton
                      key={key}
                      type={option}
                      disabled={isMagicLoading}
                      onClick={async () => await onAuthMethodSelect(option)}
                    />
                  ))}

                {/* If email option is selected from the SSO's list, show email form */}
                {activeTabIndex === 1 && isAuthenticatingWithEmail && (
                  <EmailForm
                    isLoading={isMagicLoading}
                    onCancel={() => setIsAuthenticatingWithEmail(false)}
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    onSubmit={async ({ email }) => await onEmailLogin(email)}
                  />
                )}
              </section>
            </>
          )}
        </CWModalBody>

        <CWModalFooter className="footer">
          {copy.showFooter && (
            <>
              <CWText isCentered>
                By connecting to Common you agree to our&nbsp;
                <br />
                <Link to="/terms">Terms of Service</Link>
                &nbsp;and&nbsp;
                <Link to="/privacy">Privacy Policy</Link>
              </CWText>

              {copy.showExistingAccountSignInFooter && (
                <CWText isCentered>
                  Already have an account?&nbsp;
                  <button onClick={() => onSignInClick?.()}>Sign in</button>
                </CWText>
              )}
            </>
          )}
        </CWModalFooter>
      </section>
      <EVMWalletsSubModal
        availableWallets={
          [
            ...(evmWallets.includes('walletconnect') ? ['walletconnect'] : []),
            ...evmWallets.filter((x) => x !== 'walletconnect'),
          ] as EVMWallets[]
        }
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        isOpen={isEVMWalletsModalVisible}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClose={async () => {
          setIsEVMWalletsModalVisible(false);
          isWalletConnectEnabled && (await onResetWalletConnect());
        }}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onWalletSelect={async (option) => await onAuthMethodSelect(option)}
        disabled={isMagicLoading}
        canResetWalletConnect={isWalletConnectEnabled}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onResetWalletConnect={onResetWalletConnect}
      />
      {/* Signature verification modal is only displayed on mobile */}
      <MobileWalletConfirmationSubModal
        isOpen={isMobileWalletVerificationStep}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onClose={handleClose}
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSignatureConfirmation={onVerifyMobileWalletSignature}
      />
    </>
  );
};

export { ModalBase };
