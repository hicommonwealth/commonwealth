import { ChainBase, WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import { useFlag } from 'client/scripts/hooks/useFlag';
import app from 'client/scripts/state';
import useAuthModalStore from 'client/scripts/state/ui/modals/authModal';
import AuthButton from 'client/scripts/views/components/AuthButton';
import {
  AuthSSOs,
  AuthTypes,
  AuthWallets,
  EVMWallets,
} from 'client/scripts/views/components/AuthButton/types';
import {
  CWTab,
  CWTabsRow,
} from 'client/scripts/views/components/component_kit/new_designs/CWTabs';
import clsx from 'clsx';
import React, { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  [AuthModalType.RevalidateSession]: {
    title: 'Session Expired',
    description: 'To continue what you were doing, please sign in again',
    showFooter: true,
    showExistingAccountSignInFooter: false,
  },
};

const SSO_OPTIONS: AuthSSOs[] = [
  'google',
  'discord',
  'x',
  'apple',
  'github',
  'email',
] as const;

const ModalBase = ({
  onClose,
  onSuccess,
  layoutType,
  hideDescription,
  customBody,
  showWalletsFor,
  showAuthOptionFor,
  showAuthOptionTypesFor,
  bodyClassName,
  onSignInClick,
  onChangeModalType,
}: ModalBaseProps) => {
  const userOnboardingEnabled = useFlag('userOnboardingEnabled');
  const copy = MODAL_COPY[layoutType];

  const [activeTabIndex, setActiveTabIndex] = useState<number>(
    showAuthOptionTypesFor?.includes('sso') &&
      showAuthOptionTypesFor.length === 1
      ? 1
      : 0,
  );
  const [isEVMWalletsModalVisible, setIsEVMWalletsModalVisible] =
    useState(false);
  const [isAuthenticatingWithEmail, setIsAuthenticatingWithEmail] =
    useState(false);

  useEffect(() => {
    setActiveTabIndex((prevActiveTab) => {
      if (showAuthOptionFor) {
        return SSO_OPTIONS.includes(showAuthOptionFor as AuthSSOs) ? 1 : 0;
      }

      return (showAuthOptionTypesFor?.includes('sso') &&
        showAuthOptionTypesFor.length === 1) ||
        prevActiveTab === 1
        ? 1
        : 0;
    });
  }, [showAuthOptionTypesFor, showAuthOptionFor]);

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
    // if this is the `layoutType == SignIn | RevalidateSession` modal
    // and we get an unrecognized address, then change modal type to `AccountTypeGuidance`
    if (
      layoutType === AuthModalType.SignIn ||
      layoutType === AuthModalType.RevalidateSession
    ) {
      setActiveTabIndex(0); // reset tab state back to initial
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
    withSessionKeyLoginFlow: layoutType === AuthModalType.RevalidateSession,
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
  const nearWallet = findWalletById(WalletId.NearWallet)?.name;

  const getWalletNames = () => {
    // Wallet Display Logic:
    // 1. When `showWalletsFor` is present, show wallets for that specific chain only.
    // 2. On communities based on 'Ethereum', 'Cosmos', 'Solana', 'Substrate', or 'Near' chains:
    //    - Display wallets specific to the respective community chain.
    //    - 'Near' is the only community where 'Near' wallet is shown
    // 3. On non-community pages, show 'Ethereum', 'Cosmos', 'Solana', and 'Substrate' based wallets
    // 4. On specific communities, show specific wallets
    //    a. On 'terra' community, only show 'terrastation' and 'terra-walletconnect' (wallet connect for terra) wallets
    //    b. On 'evmos' and 'injective' communities, only show 'cosm-metamask' (metamask for cosmos communities) and
    //       'keplr-ethereum' (keplr for ethereum communities) wallets

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
        case ChainBase.NEAR:
          return nearWallet ? [nearWallet] : [];
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

  const tabsList: ModalBaseTabs[] = [
    {
      name: 'Wallet',
      options: getWalletNames() as AuthWallets[],
    },
    {
      name: 'Email or Social',
      options: SSO_OPTIONS,
    },
  ];

  const onAuthMethodSelect = async (option: AuthTypes) => {
    if (option === 'email') {
      if (layoutType === AuthModalType.SignIn && userOnboardingEnabled) {
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

      await onWalletSelect(wallets.find((wallet) => wallet.name === option));
    }

    // if any SSO option is selected
    if (activeTabIndex === 1) {
      if (layoutType === AuthModalType.SignIn && userOnboardingEnabled) {
        setShouldOpenGuidanceModalAfterMagicSSORedirect(true);
      }

      // TODO: decide if twitter references are to be updated to 'x'
      await onSocialLogin(
        option === 'x' ? WalletSsoSource.Twitter : (option as WalletSsoSource),
      );
    }
  };

  const renderAuthButton = (option: AuthTypes) => {
    if (
      showAuthOptionFor &&
      option !== showAuthOptionFor &&
      !(showAuthOptionFor === 'metamask' && option === 'walletconnect')
    ) {
      return <></>;
    }

    return (
      <AuthButton
        key={option}
        type={option}
        disabled={isMagicLoading}
        onClick={async () => await onAuthMethodSelect(option)}
      />
    );
  };

  return (
    <>
      <section className="ModalBase">
        <CWIcon iconName="close" onClick={onClose} className="close-btn" />

        <img src="/static/img/branding/common-logo.svg" className="logo" />

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

          {showAuthOptionTypesFor?.length > 0 && (
            <>
              {showAuthOptionTypesFor?.length > 1 && !showAuthOptionFor && (
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
                  tabsList[activeTabIndex].options.map(renderAuthButton)}

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
          ].filter((wallet) =>
            showAuthOptionFor ? wallet === showAuthOptionFor : true,
          ) as EVMWallets[]
        }
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
