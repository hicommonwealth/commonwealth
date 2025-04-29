import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CWModal,
  CWModalBody,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';

interface UserCommunity {
  id: string;
  name: string;
  iconUrl: string;
  isStarred: boolean;
}

interface CommunitySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  communities: UserCommunity[];
}

const CommunitySelectionModal = ({
  isOpen,
  onClose,
  communities,
}: CommunitySelectionModalProps) => {
  const navigate = useNavigate();

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
          <CWModalHeader label="Select a Community" onModalClose={onClose} />
          <CWModalBody>
            <CWSelectList
              options={communityOptions}
              onChange={(option) => {
                if (option) {
                  navigate(`/${option.value}`);
                  onClose();
                }
              }}
              placeholder="Select a community..."
            />
          </CWModalBody>
        </>
      }
    />
  );
};

export default CommunitySelectionModal;
