import { findDenominationString } from 'helpers/findDenomination';
import React from 'react';
import { CWModal } from 'views/components/component_kit/new_designs/CWModal';
import ManageCommunityStakeModal from 'views/modals/ManageCommunityStakeModal';
import type { ManageCommunityStakeModalMode } from 'views/modals/ManageCommunityStakeModal/types';

type ExplorePageManageCommunityStakeModalProps = {
  mode: ManageCommunityStakeModalMode | null;
  onClose: () => void;
  selectedCommunityId?: string;
};

const ExplorePageManageCommunityStakeModal = ({
  mode,
  onClose,
  selectedCommunityId,
}: ExplorePageManageCommunityStakeModalProps) => (
  <CWModal
    size="small"
    content={
      <ManageCommunityStakeModal
        // @ts-expect-error <StrictNullChecks/>
        mode={mode}
        onModalClose={onClose}
        denomination={
          findDenominationString(selectedCommunityId || '') || 'ETH'
        }
      />
    }
    onClose={onClose}
    open={!!mode}
  />
);

export default ExplorePageManageCommunityStakeModal;
