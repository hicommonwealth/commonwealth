import commonLogo from 'assets/img/branding/common-logo.svg';
import referralImage from 'assets/img/referral-background-mobile.png';
import { useAuthModalStore } from 'client/scripts/state/ui/modals';
import { CWButton } from 'client/scripts/views/components/component_kit/new_designs/CWButton';
import React from 'react';
import { AuthModal } from '../../../AuthModal';
import './OptionalWalletModal.scss';
type OptionalWalletModalProps = {
  onComplete: () => void;
  SetIsUserFirstTime: (value: boolean) => void;
  setIsUserFromWebView: (value: boolean) => void;
  isUserFirstTime: boolean;
  isUserFromWebView: boolean;
};

const OptionalWalletModal = ({
  onComplete,
  SetIsUserFirstTime,
  setIsUserFromWebView,
  isUserFirstTime,
  isUserFromWebView,
}: OptionalWalletModalProps) => {
  const { authModalType, setAuthModalType } = useAuthModalStore();
  const handleSuccess = () => {
    SetIsUserFirstTime(false);
    setIsUserFromWebView(false);
    onComplete();
  };
  const handNext = () => {
    setIsUserFromWebView(false);
    onComplete();
  };
  return (
    <section className="OptionalWalletModal">
      <AuthModal
        type={authModalType}
        onClose={() => setAuthModalType(undefined)}
        isOpen={isUserFirstTime && isUserFromWebView}
        openEVMWalletsSubModal={isUserFirstTime && isUserFromWebView}
        isUserFromWebView={isUserFromWebView}
        onSuccess={handleSuccess}
      />
      <img src={commonLogo} className="logo" />

      <img src={referralImage} className="referral_logo" />

      <div className="buttons_container">
        <CWButton
          label={'Skip'}
          buttonWidth="wide"
          containerClassName="skip-button"
          onClick={onComplete}
        />
        <CWButton
          label={'Next'}
          buttonWidth="wide"
          onClick={handNext}
          containerClassName="next-button"
        />
      </div>
    </section>
  );
};

export { OptionalWalletModal };
