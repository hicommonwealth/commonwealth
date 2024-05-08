import React, { useEffect, useState } from 'react';

import { WalletSsoSource } from '@hicommonwealth/shared';
import useSidebarStore from 'state/ui/sidebar';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { AuthModalType } from 'views/modals/AuthModal';
import SessionRevalidationModal from 'views/modals/SessionRevalidationModal';
import { FeedbackModal } from 'views/modals/feedback_modal';

import DesktopHeader from './DesktopHeader';
import MobileHeader from './MobileHeader';

type SublayoutHeaderProps = {
  onMobile: boolean;
  isInsideCommunity: boolean;
  onAuthModalOpen: (modalType: AuthModalType) => void;
};

export const SublayoutHeader = ({
  onMobile,
  isInsideCommunity,
  onAuthModalOpen,
}: SublayoutHeaderProps) => {
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const { menuVisible, setRecentlyUpdatedVisibility } = useSidebarStore();
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
          onAuthModalOpen={onAuthModalOpen}
          isInsideCommunity={isInsideCommunity}
          onRevalidationModalData={setRevalidationModalData}
          onFeedbackModalOpen={() => setIsFeedbackModalOpen(true)}
        />
      ) : (
        <DesktopHeader
          onMobile={onMobile}
          onAuthModalOpen={onAuthModalOpen}
          onRevalidationModalData={setRevalidationModalData}
          onFeedbackModalOpen={() => setIsFeedbackModalOpen(true)}
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
