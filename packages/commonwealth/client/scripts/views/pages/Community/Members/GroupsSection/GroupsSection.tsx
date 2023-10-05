import { getClasses } from 'views/components/component_kit/helpers';
import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import app from 'state';
import Permissions from 'utils/Permissions';
import { Select } from 'views/components/Select';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import GroupCard from './GroupCard';
import './GroupsSection.scss';

const groupsFilter = ['All groups', 'In group', 'Not in group'];
const groupData = {
  isJoined: true,
  groupName: 'Hedgies Pod',
  groupDescription:
    'Lorem ipsum dolor sit amet consectetur. Urna et at velit platea sagittis feugiat gravida augue. Et mi quam mattis nisl proin scelerisque ultricies enim. Purus in eget sed rutrum vulputate in fermentum. Quam etiam nunc tristique nibh arcu tempor.',
  requirementsToFulfill: 'ALL',
  requirements: [
    {
      requirementAmount: '100',
      requirementChain: 'Ethereum',
      requirementContractAddress: '0x9AEFd6d4feF5b70119FC194D81EbAD761A3269C4',
      requirementType: 'ERC-20',
      requirementCondition: 'Equal to',
    },
    {
      requirementAmount: '50',
      requirementChain: 'Ethereum',
      requirementType: 'Evm Base Tokens',
      requirementCondition: 'Equal to',
    },
  ],
  topics: [
    {
      id: 1,
      name: 'Call updates',
    },
    {
      id: 2,
      name: 'Hedgies',
    },
  ],
};
const sampleGroups = new Array(10)
  .fill(groupData)
  .map((x, index) => ({ ...x, isJoined: (index + 1) % 2 === 0 }));

type GroupCategory = 'All groups' | 'In group' | 'Not in group';
type GroupFilters = {
  searchText?: string;
  category?: GroupCategory;
};

const GroupsSection = () => {
  const navigate = useNavigate();
  const [groupFilters, setGroupFilters] = useState<GroupFilters>({
    searchText: '',
    category: 'All groups',
  });

  const getFilteredGroups = () => {
    return sampleGroups
      .filter((group) =>
        groupFilters.searchText
          ? group.groupName
              .toLowerCase()
              .includes(groupFilters.searchText.toLowerCase())
          : true
      )
      .filter((group) =>
        groupFilters.category === 'All groups'
          ? true
          : groupFilters.category === 'In group'
          ? group.isJoined
          : !group.isJoined
      );
  };

  const navigateToCreateGroupPage = () => {
    navigate({ pathname: `${app.activeChainId()}/members/groups/create` });
  };

  return (
    <section className="GroupsSection">
      {/* Filter section */}
      <section
        className={getClasses<{
          'cols-3': boolean;
          'cols-4': boolean;
        }>(
          {
            'cols-3': !Permissions.isCommunityAdmin(),
            'cols-4': Permissions.isCommunityAdmin(),
          },
          'filters'
        )}
      >
        <CWTextInput
          size="large"
          fullWidth
          placeholder="Search groups"
          iconLeft={<CWIcon iconName="search" className="search-icon" />}
          onInput={(e) =>
            setGroupFilters((g) => ({
              ...g,
              searchText: e.target.value?.trim(),
            }))
          }
        />
        <CWText type="b2" fontWeight="bold" className="filter-text">
          Filter
        </CWText>
        <Select
          containerClassname="select-dropdown"
          options={groupsFilter.map((x) => ({ id: x, label: x, value: x }))}
          selected={groupFilters.category}
          dropdownPosition="bottom-end"
          onSelect={(item: any) => {
            setGroupFilters((g) => ({ ...g, category: item.value }));
          }}
        />
        {Permissions.isCommunityAdmin() && (
          <CWButton
            buttonWidth="full"
            label="Create group"
            iconLeft={'plus'}
            onClick={navigateToCreateGroupPage}
          />
        )}
      </section>

      {/* Groups list section */}
      <section className="groups-list">
        {getFilteredGroups().map((group, index) => (
          <GroupCard {...group} />
        ))}
      </section>
    </section>
  );
};

export default GroupsSection;
