import React from 'react';
import { SearchFilters } from '../index.types';
import GroupCard from './GroupCard';
import './GroupsSection.scss';

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

type GroupsSectionProps = {
  searchFilters: SearchFilters;
};

const GroupsSection = ({ searchFilters }: GroupsSectionProps) => {
  const getFilteredGroups = () => {
    return sampleGroups
      .filter((group) =>
        searchFilters.searchText
          ? group.groupName
              .toLowerCase()
              .includes(searchFilters.searchText.toLowerCase())
          : true
      )
      .filter((group) =>
        searchFilters.category === 'All groups'
          ? true
          : searchFilters.category === 'In group'
          ? group.isJoined
          : !group.isJoined
      );
  };

  return (
    <section className="GroupsSection">
      {/* Groups list section */}
      <section className="groups-list">
        {/* {getFilteredGroups().map((group, index) => (
          <GroupCard {...group} />
        ))} */}
      </section>
    </section>
  );
};

export default GroupsSection;
