import shape1Url from 'assets/img/shapes/shape1.svg';
import shape3Url from 'assets/img/shapes/shape3.svg';
import shape4Url from 'assets/img/shapes/shape4.svg';
import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import Permissions from 'utils/Permissions';
import { ActionCard, CardsSlider, DismissModal } from '../CardsSlider'; // Assuming CardsSlider and related components are reusable
import { CWModal } from '../component_kit/new_designs/CWModal';

// Define card types relevant to admin guidance
const ADMIN_CARD_TYPES = {
  'manage-contests': {
    iconURL: shape1Url, // Reusing icons for now, replace if needed
    title: 'Manage Contests',
    description: 'Create and manage community contests.',
    ctaText: 'View Contests',
  },
  'manage-topics': {
    iconURL: shape3Url, // Reusing icons for now
    title: 'Organize with Topics',
    description: 'Create and manage topics for discussions.',
    ctaText: 'Manage Topics',
  },
  'manage-members': {
    iconURL: shape4Url, // Reusing icons for now
    title: 'Manage Members & Roles',
    description: 'Assign roles and manage user groups.',
    ctaText: 'View Members',
  },
  // Add other relevant admin quick links here if needed
};

export const AdminGuidanceSlider = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  // Use local state for dismissal - could be enhanced with localStorage or a dedicated store later
  const [isDismissed, setIsDismissed] = useState(false);

  const navigate = useCommonNavigate();
  const communityId = app.activeChainId() || '';

  // Simplified visibility check: only admin status and local dismissal state
  const isSliderHidden =
    !communityId ||
    !(Permissions.isSiteAdmin() || Permissions.isCommunityAdmin()) ||
    isDismissed;

  const redirectToAdminPage = (
    pageKey: 'manage-contests' | 'manage-topics' | 'manage-members',
  ) => {
    switch (pageKey) {
      case 'manage-contests':
        navigate(`/manage/contests`);
        break;
      case 'manage-topics':
        navigate('/manage/topics');
        break;
      case 'manage-members':
        navigate('/members');
        break;
    }
  };

  // Hide component if not admin or dismissed
  if (isSliderHidden) {
    return null;
  }

  return (
    <>
      <CardsSlider
        containerClassName="AdminGuidanceSliderPageLayout" // Use specific class name
        className="AdminGuidanceSlider" // Use specific class name
        headerText="Admin Quick Links" // Updated header
        onDismiss={() => setIsModalVisible(true)} // Trigger dismiss modal
      >
        {/* Render admin guidance cards */}
        <ActionCard
          ctaText={ADMIN_CARD_TYPES['manage-contests'].ctaText}
          title={ADMIN_CARD_TYPES['manage-contests'].title}
          description={ADMIN_CARD_TYPES['manage-contests'].description}
          iconURL={ADMIN_CARD_TYPES['manage-contests'].iconURL}
          iconAlt="manage-contests-icon"
          isActionCompleted={false} // These aren't really 'completable' actions
          onCTAClick={() => redirectToAdminPage('manage-contests')}
        />
        <ActionCard
          ctaText={ADMIN_CARD_TYPES['manage-topics'].ctaText}
          title={ADMIN_CARD_TYPES['manage-topics'].title}
          description={ADMIN_CARD_TYPES['manage-topics'].description}
          iconURL={ADMIN_CARD_TYPES['manage-topics'].iconURL}
          iconAlt="manage-topics-icon"
          isActionCompleted={false}
          onCTAClick={() => redirectToAdminPage('manage-topics')}
        />
        <ActionCard
          ctaText={ADMIN_CARD_TYPES['manage-members'].ctaText}
          title={ADMIN_CARD_TYPES['manage-members'].title}
          description={ADMIN_CARD_TYPES['manage-members'].description}
          iconURL={ADMIN_CARD_TYPES['manage-members'].iconURL}
          iconAlt="manage-members-icon"
          isActionCompleted={false}
          onCTAClick={() => redirectToAdminPage('manage-members')}
        />
      </CardsSlider>

      {/* Reusable Modal for Dismissal */}
      <CWModal
        size="small"
        visibleOverflow
        content={
          <DismissModal
            label="Admin Quick Links" // Updated label
            description="These cards provide quick access to common admin areas. You can dismiss this slider temporarily." // Simplified description
            showDismissCheckbox={false} // Simplfied: Only temporary dismiss for now
            onModalClose={() => setIsModalVisible(false)}
            onDismiss={() => {
              // Only temporary dismiss implemented here
              setIsModalVisible(false);
              setIsDismissed(true); // Set local state to hide
            }}
          />
        }
        onClose={() => setIsModalVisible(false)}
        open={isModalVisible}
      />
    </>
  );
};

// Add index file for export if following pattern
// Example: packages/commonwealth/client/scripts/views/components/AdminGuidanceSlider/index.ts
// export * from './AdminGuidanceSlider';
