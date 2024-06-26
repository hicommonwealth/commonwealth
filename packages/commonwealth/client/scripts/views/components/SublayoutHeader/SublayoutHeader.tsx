import React, { useEffect, useState } from 'react';

import { WalletSsoSource } from '@hicommonwealth/shared';
import useSidebarStore from 'state/ui/sidebar';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import { AuthModalType } from 'views/modals/AuthModal';
import SessionRevalidationModal from 'views/modals/SessionRevalidationModal';

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
  const [revalidationModalData, setRevalidationModalData] = useState<{
    walletSsoSource: WalletSsoSource;
    walletAddress: string;
    // @ts-expect-error <StrictNullChecks/>
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
        />
      ) : (
        <DesktopHeader
          onMobile={onMobile}
          onAuthModalOpen={onAuthModalOpen}
          onRevalidationModalData={setRevalidationModalData}
        />
      )}
      <CWModal
        size="medium"
        content={
          <SessionRevalidationModal
            // @ts-expect-error <StrictNullChecks/>
            onModalClose={() => setRevalidationModalData(null)}
            walletSsoSource={revalidationModalData?.walletSsoSource}
            walletAddress={revalidationModalData?.walletAddress}
          />
        }
        // @ts-expect-error <StrictNullChecks/>
        onClose={() => setRevalidationModalData(null)}
        open={!!revalidationModalData}
      />
    </>
  );
};
