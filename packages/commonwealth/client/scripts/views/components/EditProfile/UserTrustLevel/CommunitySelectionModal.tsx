import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import {
  CWModal,
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWDivider } from '../../component_kit/cw_divider';
import './CommunitySelectionModal.scss';

interface UserCommunity {
  id: string;
  name: string;
  iconUrl: string;
  isStarred: boolean;
}

interface CommunitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (communityId: string | null) => void;
  communities: UserCommunity[];
}

const CommunitySelectionModal = ({
  isOpen,
  onClose,
  onSelect,
  communities,
}: CommunitySelectionModalProps) => {
  const communityOptions = communities.map((community) => ({
    value: community.id,
    label: community.name,
  }));

  return (
    <CWModal
      open={isOpen}
      onClose={onClose}
      content={
        <>
          <CWModalHeader label="Verify Community" onModalClose={onClose} />
          <CWModalBody>
            <div className="CommunitySectionModal">
              <CWText type="b1" className="description">
                Choose an existing community or create a new one to verify your
                trust level.
              </CWText>
              <CWSelectList
                options={communityOptions}
                onChange={(option) => {
                  if (option) {
                    onSelect(option.value);
                  }
                }}
                placeholder="Select a community..."
              />
              <CWDivider />
              <div className="create-community-button">
                <CWButton
                  label="Create New Community"
                  buttonType="primary"
                  buttonHeight="lg"
                  onClick={() => {
                    onSelect(null);
                  }}
                />
              </div>
            </div>
          </CWModalBody>
        </>
      }
    />
  );
};

export default CommunitySelectionModal;
