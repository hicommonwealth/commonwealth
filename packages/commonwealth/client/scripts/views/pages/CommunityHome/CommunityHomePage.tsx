import { findDenominationString } from 'helpers/findDenomination';
import { useFlag } from 'hooks/useFlag';
import React, { useRef, useState } from 'react';
import { useManageCommunityStakeModalStore } from 'state/ui/modals';
import CWPageLayout from 'views/components/component_kit/new_designs/CWPageLayout';
import { CWText } from '../../components/component_kit/cw_text';
import { CWModal } from '../../components/component_kit/new_designs/CWModal';
import ManageCommunityStakeModal from '../../modals/ManageCommunityStakeModal/ManageCommunityStakeModal';
import IdeaLaunchpad from '../Communities/IdeaLaunchpad';
import './CommunityHomePage.scss';

const CommunityHome = () => {
  const containerRef = useRef();
  const tokenizedCommunityEnabled = useFlag('tokenizedCommunity');

  const {
    setModeOfManageCommunityStakeModal,
    modeOfManageCommunityStakeModal,
  } = useManageCommunityStakeModalStore();

  const [selectedCommunityId, setSelectedCommunityId] = useState<string>();

  return (
    // @ts-expect-error <StrictNullChecks/>
    <CWPageLayout ref={containerRef} className="CommunitiesPageLayout">
      <div className="CommunityHome">
        <div className="header-section">
          <div className="description">
            <CWText
              type="h1"
              {...(tokenizedCommunityEnabled && { fontWeight: 'semiBold' })}
            >
              Home {tokenizedCommunityEnabled ? '' : 'Communities'}
            </CWText>
          </div>
          <IdeaLaunchpad />
        </div>
        <CWModal
          size="small"
          content={
            <ManageCommunityStakeModal
              mode={modeOfManageCommunityStakeModal}
              // @ts-expect-error <StrictNullChecks/>
              onModalClose={() => setModeOfManageCommunityStakeModal(null)}
              denomination={
                findDenominationString(selectedCommunityId || '') || 'ETH'
              }
            />
          }
          // @ts-expect-error <StrictNullChecks/>
          onClose={() => setModeOfManageCommunityStakeModal(null)}
          open={!!modeOfManageCommunityStakeModal}
        />
      </div>
    </CWPageLayout>
  );
};

export default CommunityHome;
