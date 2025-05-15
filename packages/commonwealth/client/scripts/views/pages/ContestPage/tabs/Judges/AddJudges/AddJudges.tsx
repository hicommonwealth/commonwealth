import { formatAddressShort } from 'helpers';
import React, { useState } from 'react';
import { useGetMembersQuery } from 'state/api/communities';
import { useDebounce } from 'usehooks-ts';
import { CWAvatar } from 'views/components/component_kit/cw_avatar';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import CWCircleMultiplySpinner from 'views/components/component_kit/new_designs/CWCircleMultiplySpinner';
import {
  CWModalBody,
  CWModalFooter,
  CWModalHeader,
} from 'views/components/component_kit/new_designs/CWModal';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';

import './AddJudges.scss';

interface AddJudgesProps {
  onClose: () => void;
  onAddJudges: (judges: string[]) => void;
  communityId: string;
  currentJudges: string[];
}

const AddJudges = ({
  onClose,
  onAddJudges,
  communityId,
  currentJudges,
}: AddJudgesProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAddresses, setSelectedAddresses] = useState<string[]>([]);
  const debouncedSearchTerm = useDebounce<string>(searchTerm, 300);

  const { data: members, isLoading } = useGetMembersQuery({
    community_id: communityId,
    search: debouncedSearchTerm,
    apiEnabled: !!communityId && debouncedSearchTerm.length > 2,
    limit: 10,
  });

  const handleSelectUser = (address: string) => {
    setSelectedAddresses((prev) => {
      if (prev.includes(address)) {
        return prev.filter((a) => a !== address);
      } else {
        return [...prev, address];
      }
    });
  };

  const handleAddJudges = () => {
    onAddJudges(selectedAddresses);
    onClose();
  };

  const filteredMembers = members?.pages[0]?.results || [];

  return (
    <div className="AddJudges">
      <CWModalHeader label="Add Contest Judges" onModalClose={onClose} />

      <CWModalBody>
        <div className="search-container">
          <CWTextInput
            fullWidth
            size="large"
            placeholder="Search members by name or address"
            iconLeft={<CWIcon iconName="search" />}
            onInput={(e) => setSearchTerm(e.target.value)}
            value={searchTerm}
          />
        </div>

        <div className="users-list">
          {isLoading ? (
            <div className="loading-container">
              <CWCircleMultiplySpinner />
            </div>
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map((member) => {
              const address = member.addresses[0].address;
              const isSelected = selectedAddresses.includes(address);

              return (
                <div
                  key={address}
                  className={`user-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectUser(address)}
                >
                  <div className="user-avatar">
                    <CWAvatar size={36} avatarUrl={member.avatar_url || ''} />
                  </div>
                  <div className="user-info">
                    <div className="user-name">
                      <CWText>{member.profile_name || 'Anonymous'}</CWText>
                    </div>
                    <div className="user-address">
                      <CWText type="b2">{formatAddressShort(address)}</CWText>
                    </div>
                  </div>
                </div>
              );
            })
          ) : searchTerm.length > 2 ? (
            <div className="no-results">
              <CWText>No matching members found</CWText>
            </div>
          ) : (
            <div className="no-results">
              <CWText>Type at least 3 characters to search</CWText>
            </div>
          )}
        </div>
      </CWModalBody>

      <CWModalFooter>
        <CWButton label="Cancel" buttonType="secondary" onClick={onClose} />
        <CWButton
          label="Add Judges"
          buttonType="primary"
          onClick={handleAddJudges}
          disabled={selectedAddresses.length === 0}
        />
      </CWModalFooter>
    </div>
  );
};

export default AddJudges;
