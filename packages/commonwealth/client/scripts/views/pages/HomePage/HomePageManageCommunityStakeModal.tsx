import { findDenominationString } from 'helpers/findDenomination';
import React from 'react';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import ManageCommunityStakeModal from 'views/modals/ManageCommunityStakeModal';

type HomePageManageCommunityStakeModalProps = {
  communityId?: string;
};

const HomePageManageCommunityStakeModal = ({
  communityId,
}: HomePageManageCommunityStakeModalProps) => {
  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  return (
    <CWModal
      size="small"
      content={
        <ManageCommunityStakeModal
          mode={modeOfManageCommunityStakeModal}
          // @ts-expect-error <StrictNullChecks/>
          onModalClose={() => setModeOfManageCommunityStakeModal(null)}
          denomination={findDenominationString(communityId || '') || 'ETH'}
        />
      }
      // @ts-expect-error <StrictNullChecks/>
      onClose={() => setModeOfManageCommunityStakeModal(null)}
      open={!!modeOfManageCommunityStakeModal}
    />
  );
};

export default HomePageManageCommunityStakeModal;
