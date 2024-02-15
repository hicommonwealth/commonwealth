import React, { useEffect, useState } from 'react';

import { WalletSsoSource } from '@hicommonwealth/core';
import { useFlag } from 'hooks/useFlag';
import useSidebarStore from 'state/ui/sidebar';
import DesktopHeader from 'views/components/SublayoutHeader/DesktopHeader';
import MobileHeader from 'views/components/SublayoutHeader/MobileHeader';
import { isWindowMediumSmallInclusive } from 'views/components/component_kit/helpers';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { AuthModal } from 'views/modals/AuthModal';
import SessionRevalidationModal from 'views/modals/SessionRevalidationModal';
import { FeedbackModal } from 'views/modals/feedback_modal';
import { LoginModal } from 'views/modals/login_modal';

type SublayoutHeaderProps = {
  onMobile: boolean;
  isInsideCommunity: boolean;
};

export const SublayoutHeader = ({
  onMobile,
  isInsideCommunity,
}: SublayoutHeaderProps) => {
  const newSignInModalEnabled = useFlag('newSignInModal');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const { menuVisible, setRecentlyUpdatedVisibility } = useSidebarStore();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [revalidationModalData, setRevalidationModalData] = useState<{
    walletSsoSource: WalletSsoSource;
    walletAddress: string;
  }>(null);

  useEffect(() => {
    setRecentlyUpdatedVisibility(menuVisible);
  }, [menuVisible, setRecentlyUpdatedVisibility]);

  return (
    <>
      {onMobile ? (
        <MobileHeader
          onMobile={onMobile}
          onAuthModalOpen={() => setIsAuthModalOpen(true)}
          isInsideCommunity={isInsideCommunity}
          onRevalidationModalData={setRevalidationModalData}
        />
      ) : (
        <DesktopHeader
          onMobile={onMobile}
          onAuthModalOpen={() => setIsAuthModalOpen(true)}
          onRevalidationModalData={setRevalidationModalData}
        />
      )}

      <CWModal
        size="small"
        content={
          <FeedbackModal onModalClose={() => setIsFeedbackModalOpen(false)} />
        }
        onClose={() => setIsFeedbackModalOpen(false)}
        open={isFeedbackModalOpen}
      />

      {!newSignInModalEnabled ? (
        <CWModal
          content={
            <LoginModal onModalClose={() => setIsAuthModalOpen(false)} />
          }
          isFullScreen={isWindowMediumSmallInclusive(window.innerWidth)}
          onClose={() => setIsAuthModalOpen(false)}
          open={isAuthModalOpen}
        />
      ) : (
        <AuthModal
          onClose={() => setIsAuthModalOpen(false)}
          isOpen={isAuthModalOpen}
        />
      )}

      <CWModal
        size="medium"
        content={
          <SessionRevalidationModal
            onModalClose={() => setRevalidationModalData(null)}
            walletSsoSource={revalidationModalData?.walletSsoSource}
            walletAddress={revalidationModalData?.walletAddress}
          />
        }
        onClose={() => setRevalidationModalData(null)}
        open={!!revalidationModalData}
      />
    </>
  );
};
