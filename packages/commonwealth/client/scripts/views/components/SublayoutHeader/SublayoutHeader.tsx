import React, { useEffect } from 'react';

import useSidebarStore from 'state/ui/sidebar';
import { AuthModalType } from 'views/modals/AuthModal';

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
  const { menuVisible, setRecentlyUpdatedVisibility } = useSidebarStore();

  useEffect(() => {
    setRecentlyUpdatedVisibility(menuVisible);
  }, [menuVisible, setRecentlyUpdatedVisibility]);

  return onMobile ? (
    <MobileHeader
      onMobile={onMobile}
      onAuthModalOpen={onAuthModalOpen}
      isInsideCommunity={isInsideCommunity}
    />
  ) : (
    <DesktopHeader onMobile={onMobile} onAuthModalOpen={onAuthModalOpen} />
  );
};
