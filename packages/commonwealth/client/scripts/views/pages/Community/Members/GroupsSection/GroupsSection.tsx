import React from 'react';
import { Select } from 'views/components/Select';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import GroupCard from './GroupCard';
import './GroupsSection.scss';

const groupsFilter = ['All groups', 'In group', 'Not in group'];
const groupData = {
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

const GroupsSection = () => {
  return (
    <section className="GroupsSection">
      {/* Filter section */}
      <section className="filters">
        <CWTextInput
          size="large"
          fullWidth
          placeholder="Search groups"
          iconLeft={<CWIcon iconName="search" className="search-icon" />}
        />
        <CWText type="b2" fontWeight="bold" className="filter-text">
          Filter
        </CWText>
        <Select
          containerClassname="select-dropdown"
          options={groupsFilter.map((x) => ({ id: x, label: x, value: x }))}
          selected={groupsFilter[0]}
          dropdownPosition="bottom-end"
        />
        <CWButton buttonWidth="full" label="Create group" iconLeft={'plus'} />
      </section>

      {/* Groups list section */}
      <section className="groups-list">
        {new Array(10).fill(groupData).map((group, index) => (
          <GroupCard {...group} isJoined={(index + 1) % 2 === 0} />
        ))}
      </section>
    </section>
  );
};

export default GroupsSection;
