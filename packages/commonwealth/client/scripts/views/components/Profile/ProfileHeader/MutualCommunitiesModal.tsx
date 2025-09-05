import React from 'react';
import type NewProfile from '../../../../models/NewProfile';
import { CWButton } from '../../component_kit/new_designs/CWButton';
import {
  CWModal,
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from '../../component_kit/new_designs/CWModal';
import { MutualCommunitiesModalContent } from './MutualCommunitiesModalContent';

type MutualCommunity = {
  id: string;
  name: string;
  base: string;
  icon_url?: string | null;
  tier: string;
};

type MutualCommunitiesModalProps = {
  isOpen: boolean;
  onClose: () => void;
  viewedUserProfile: NewProfile;
  mutualCommunities: MutualCommunity[];
  karma?: number;
};

export const MutualCommunitiesModal = ({
  isOpen,
  onClose,
  viewedUserProfile,
  mutualCommunities,
  karma,
}: MutualCommunitiesModalProps) => {
  return (
    <CWModal
      open={isOpen}
      onClose={onClose}
      size="large"
      content={
        <>
          <CWModalHeader label="Profile Details" onModalClose={onClose} />
          <CWModalBody>
            <MutualCommunitiesModalContent
              viewedUserProfile={viewedUserProfile}
              mutualCommunities={mutualCommunities}
              karma={karma}
              onClose={onClose}
            />
          </CWModalBody>
          <CWModalFooter>
            <CWButton
              buttonType="secondary"
              buttonHeight="sm"
              label="Close"
              onClick={onClose}
            />
          </CWModalFooter>
        </>
      }
    />
  );
};
