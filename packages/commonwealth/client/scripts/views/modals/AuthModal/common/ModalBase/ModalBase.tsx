import { ChainBase, WalletId, WalletSsoSource } from '@hicommonwealth/shared';
import commonLogo from 'assets/img/branding/common-logo.svg';
import { notifyError } from 'client/scripts/controllers/app/notifications';
import { useFlag } from 'client/scripts/hooks/useFlag';
import useFarcasterStore from 'client/scripts/state/ui/farcaster';
import clsx from 'clsx';
import { isMobileApp } from 'hooks/useReactNativeWebView';
import React, { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import app from 'state';
import AuthButton from 'views/components/AuthButton';
import {
  AuthSSOs,
  AuthTypes,
  AuthWallets,
  EVMWallets,
} from 'views/components/AuthButton/types';
import { PrivyEmailDialog } from 'views/components/Privy/dialogs/PrivyEmailDialog';
import { PrivySMSDialog } from 'views/components/Privy/dialogs/PrivySMSDialog';
import { CWIcon } from '../../../../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../../../../components/component_kit/cw_text';
import {
  CWModalBody,
  CWModalFooter,
} from '../../../../components/component_kit/new_designs/CWModal';
import { TemporaryCrecimientoModalBase } from '../../TemporaryCrecimientoModalBase';
import { AuthModalType, ModalBaseProps, ModalBaseTabs } from '../../types';
import useAuthentication from '../../useAuthentication';
import { EVMWalletsSubModal } from './EVMWalletsSubModal';
import { EmailForm } from './EmailForm';
import { MobileWalletConfirmationSubModal } from './MobileWalletConfirmationSubModal';
import './ModalBase.scss';
import { SMSForm } from './SMSForm';

const MODAL_COPY = {
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
    description:
      'To continue what you were doing with this address, please sign in again',
    showFooter: true,
    showExistingAccountSignInFooter: false,
  },
};

const mobileApp = isMobileApp();

const SSO_OPTIONS_DEFAULT: AuthSSOs[] = [
  'google',
  'discord',
  'x',
  'apple',
  'github',
  'email',
  'farcaster',
  'SMS',
] as const;

const SSO_OPTIONS_MOBILE: AuthSSOs[] = [
  'google',
  'apple',
  'email',
  'SMS',
] as const;

const SSO_OPTIONS = mobileApp ? SSO_OPTIONS_MOBILE : SSO_OPTIONS_DEFAULT;

/**
 * AuthModal base component with customizable options, callbacks, layouts and auth options display strategy.
 * @param onClose callback triggered when the modal is closed or user is authenticated.
 * @param onSuccess callback triggered on successful user authentication.
 * @param layoutType specifies the layout type/variant of the modal.
 * @param showAuthOptionFor determines the auth option to display.
 *                          Modal logic correctly displayed the correct options per page scope if prop is not provided.
 *                          Prop is ignored if internal modal state hides SSO options.
 * @param showAuthOptionTypesFor determines auth options category ('wallets', 'sso', or both) to display.
 *                               All options are displayed if prop is not provided.
 *                               Prop is ignored if internal modal state hides SSO options.
 * @param showWalletsFor specifies wallets to display for the specified chain.
 * @param bodyClassName custom class to apply to the modal body.
 * @param onSignInClick callback triggered when the user clicks on the `Sign in` link in the modal footer.
 * @returns {ReactNode}
 */
const ModalBase = ({
  onClose,
  onSuccess,
  layoutType,
  showWalletsFor,
  showAuthOptionFor,
  showAuthOptionTypesFor,
  bodyClassName,
  onSignInClick,
  triggerOpenEVMWalletsSubModal,
  isUserFromWebView = false,
}: ModalBaseProps) => {
  const copy = MODAL_COPY[layoutType];

  const partnershipWalletEnabled = useFlag('partnershipWallet');
  const crecimientoHackathonEnabled = useFlag('crecimientoHackathon');

  const { farcasterContext, signInToFarcasterFrame } = useFarcasterStore();
  const [activeTabIndex, setActiveTabIndex] = useState<number>(
    showAuthOptionTypesFor?.includes('sso') &&
      showAuthOptionTypesFor.length === 1
      ? 1
      : 0,
  );
  const [isEVMWalletsModalVisible, setIsEVMWalletsModalVisible] = useState(
    () => {
      return triggerOpenEVMWalletsSubModal
        ? triggerOpenEVMWalletsSubModal
        : false;
    },
  );
  const [isAuthenticatingWithEmail, setIsAuthenticatingWithEmail] =
    useState(false);
  const [isAuthenticatingWithSMS, setIsAuthenticatingWithSMS] = useState(false);
  const [showcrecimientoHackathonModal, setShowCrecimientoHackathonModal] =
    useState(
      crecimientoHackathonEnabled &&
        app?.chain?.id?.toLowerCase() === 'crecimiento',
    );

  const handleClose = async () => {
    setIsAuthenticatingWithEmail(false);
    setIsAuthenticatingWithSMS(false);
    setIsEVMWalletsModalVisible(false);
    isWalletConnectEnabled &&
      (await onResetWalletConnect().catch(console.error));
    await onClose();
  };

  const handleSuccess = async (_, isNewlyCreated) => {
    await onSuccess?.(isNewlyCreated, isUserFromWebView);
    await handleClose();
  };

  const {
    wallets = [],
    isMagicLoading,
    isWalletConnectEnabled,
    isMobileWalletVerificationStep,
    onResetWalletConnect,
    onEmailLogin,
    onSMSLogin,
    onWalletSelect,
    onSocialLogin,
    onFarcasterLogin,
    onVerifyMobileWalletSignature,
  } = useAuthentication({
    withSessionKeyLoginFlow: layoutType === AuthModalType.RevalidateSession,
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    onModalClose: handleClose,
    onSuccess: handleSuccess,
    isUserFromWebView: isUserFromWebView,
  });

  const filterWalletNames = (byChain: ChainBase) =>
    wallets
      .filter((wallet) => wallet.chain === byChain)
      .map((wallet) => wallet.name);
  const findWalletById = (walletId: WalletId) =>
    wallets.find((wallet) => wallet.name === walletId);

  const hasWalletConnect = findWalletById(WalletId.WalletConnect);
  const isOkxWalletAvailable = findWalletById(WalletId.OKX);
  const isBinanceWalletAvailable = findWalletById(WalletId.Binance);
  const evmWallets = filterWalletNames(ChainBase.Ethereum) as EVMWallets[];
  const cosmosWallets = filterWalletNames(ChainBase.CosmosSDK);
  const solanaWallets = filterWalletNames(ChainBase.Solana);
  const substrateWallets = filterWalletNames(ChainBase.Substrate);
  const suiWallets = filterWalletNames(ChainBase.Sui);
  const getEVMWalletsForMainModal = () => {
    const configEvmWallets: string[] = [];
    if (partnershipWalletEnabled) {
      if (isOkxWalletAvailable) {
        configEvmWallets.push('okx');
      }
      if (isBinanceWalletAvailable) {
        configEvmWallets.push('binance');
      }
    }
    if (hasWalletConnect) {
      configEvmWallets.push('walletconnect');
    }
    return configEvmWallets;
  };
  const getEVMWalletsForEVMSubModal = () => {
    const configEvmWallets: string[] = [
      // to ensure it always comes first
      ...(evmWallets.includes('walletconnect') ? ['walletconnect'] : []),
      ...evmWallets.filter((x) => {
        if (!partnershipWalletEnabled) {
          if (x === 'okx' || x === 'binance') return false;
        }

        return x !== 'walletconnect';
      }),
    ];

    return configEvmWallets;
  };
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
        case ChainBase.Ethereum: {
          return getEVMWalletsForMainModal();
        }
        case ChainBase.CosmosSDK:
          return cosmosWallets;
        case ChainBase.Solana:
          return solanaWallets;
        case ChainBase.Substrate:
          return substrateWallets;
        case ChainBase.Sui:
          return suiWallets;
        default:
          return [];
      }
    }

    if (!app?.chain?.base) {
      const configEvmWallets = getEVMWalletsForMainModal();
      return [
        ...configEvmWallets,
        ...cosmosWallets,
        ...solanaWallets,
        ...substrateWallets,
        ...suiWallets,
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
      options: SSO_OPTIONS,
    },
  ];

  useEffect(() => {
    setActiveTabIndex((prevActiveTab) => {
      if (!shouldShowSSOOptions && prevActiveTab === 1) return 0;

      if (isMobileApp()) return 1;

      if (showAuthOptionFor) {
        return SSO_OPTIONS.includes(showAuthOptionFor as AuthSSOs) ? 1 : 0;
      }

      if (
        (showAuthOptionTypesFor?.includes('sso') &&
          showAuthOptionTypesFor.length === 1) ||
        prevActiveTab === 1
      ) {
        return 1;
      }

      return 0;
    });
  }, [showAuthOptionTypesFor, showAuthOptionFor, shouldShowSSOOptions]);

  const onAuthMethodSelect = async (option: AuthTypes) => {
    if (option === 'email') {
      setIsAuthenticatingWithEmail(true);
      return;
    }
    if (option === 'SMS') {
      setIsAuthenticatingWithSMS(true);
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
      // TODO: decide if twitter references are to be updated to 'x'
      await onSocialLogin(
        option === 'x' ? WalletSsoSource.Twitter : (option as WalletSsoSource),
      );
    }
  };

  const handleFarcasterFrameSignIn = async () => {
    try {
      const { result, privateKey } = await signInToFarcasterFrame();
      await onFarcasterLogin(result.signature, result.message, privateKey);
    } catch (err) {
      notifyError('Farcaster sign in failed');
      console.error('Farcaster sign in failed:', err);
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
      <PrivySMSDialog />
      <PrivyEmailDialog />
      <section className="ModalBase">
        {!isUserFromWebView && (
          <CWIcon iconName="close" onClick={onClose} className="close-btn" />
        )}

        <img src={commonLogo} className={clsx('logo', { mobileApp })} />

        <CWText type="h2" className="header" isCentered>
          {copy.title}
        </CWText>

        {copy.description && (
          <CWText type="b1" className="description" isCentered>
            {...copy.description.split('\n').map((line, index) => (
              <Fragment key={index}>
                {line}
                <br />
              </Fragment>
            ))}
          </CWText>
        )}

        <CWModalBody className={clsx('content', bodyClassName, { mobileApp })}>
          {showcrecimientoHackathonModal ? (
            <TemporaryCrecimientoModalBase
              onOtherMethodsSignIn={() =>
                setShowCrecimientoHackathonModal(false)
              }
              onTwitterSignIn={() => {
                onAuthMethodSelect('x').catch(console.error);
              }}
            />
          ) : (
            (showAuthOptionTypesFor || [])?.length > 0 && (
              <>
                {/* {shouldShowSSOOptions &&
                  // @ts-expect-error StrictNullChecks*
                  showAuthOptionTypesFor?.length > 1 &&
                  !showAuthOptionFor && (
                    <CWTabsRow className="tabs">
                      {tabsList.map((tab, index) => (
                        <CWTab
                          key={tab.name}
                          label={tab.name}
                          isDisabled={
                            isMagicLoading ||
                            (!!farcasterContext && index === 1)
                          }
                          isSelected={
                            tabsList[activeTabIndex].name === tab.name
                          }
                          onClick={() => setActiveTabIndex(index)}
                        />
                      ))}
                    </CWTabsRow>
                  )} */}

                <section className="auth-options">
                  {/* On the wallets tab, if no wallet is found, show "No wallets Found" */}
                  {activeTabIndex === 0 &&
                    tabsList[activeTabIndex].options.length === 0 && (
                      <AuthButton type="NO_WALLETS_FOUND" />
                    )}

                  {/*
                  If email or SMS option is selected don't render SSO's list,
                  else render wallets/SSO's list based on activeTabIndex
                */}

                  {farcasterContext ? (
                    <AuthButton
                      type="farcaster"
                      onClick={() => {
                        void handleFarcasterFrameSignIn().catch(console.error);
                      }}
                    />
                  ) : (
                    (activeTabIndex === 0 ||
                      (activeTabIndex === 1 &&
                        !isAuthenticatingWithEmail &&
                        !isAuthenticatingWithSMS)) &&
                    tabsList[activeTabIndex].options.map(renderAuthButton)
                  )}

                  {/* If email option is selected from the SSO's list, show email form */}
                  {activeTabIndex === 1 && isAuthenticatingWithEmail && (
                    <EmailForm
                      isLoading={isMagicLoading}
                      onCancel={() => setIsAuthenticatingWithEmail(false)}
                      // eslint-disable-next-line @typescript-eslint/no-misused-promises
                      onSubmit={async ({ email }) => await onEmailLogin(email)}
                    />
                  )}
                  {/* If SMS option is selected from the SSO's list, show SMS form */}
                  {activeTabIndex === 1 && isAuthenticatingWithSMS && (
                    <SMSForm
                      isLoading={isMagicLoading}
                      onCancel={() => setIsAuthenticatingWithSMS(false)}
                      // eslint-disable-next-line @typescript-eslint/no-misused-promises
                      onSubmit={async ({ SMS }) => await onSMSLogin(SMS)}
                    />
                  )}
                </section>
              </>
            )
          )}
        </CWModalBody>

        <CWModalFooter className="footer">
          {copy.showFooter && (
            <>
              <CWText isCentered>
                By connecting to Common you agree to our&nbsp;
                <br />
                <Link to="/terms" onClick={() => onClose()}>
                  Terms of Service
                </Link>
                &nbsp;and&nbsp;
                <Link to="/privacy" onClick={() => onClose()}>
                  Privacy Policy
                </Link>
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
          getEVMWalletsForEVMSubModal().filter((wallet) =>
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
        isUserFromWebView={isUserFromWebView}
        handleNextOrSkip={handleSuccess}
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
