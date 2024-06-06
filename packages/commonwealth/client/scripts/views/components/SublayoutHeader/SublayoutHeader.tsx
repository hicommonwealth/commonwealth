import React, { useEffect, useState } from 'react';

import useSidebarStore from 'state/ui/sidebar';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { AuthModalType } from 'views/modals/AuthModal';
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
          onFeedbackModalOpen={() => setIsFeedbackModalOpen(true)}
        />
      ) : (
        <DesktopHeader
          onMobile={onMobile}
          onAuthModalOpen={onAuthModalOpen}
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
    </>
  );
};
