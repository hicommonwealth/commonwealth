import { useCommonNavigate } from 'navigation/helpers';
import React, { useState } from 'react';
import app from 'state';
import { useFetchGroupsQuery } from 'state/api/groups';
import Permissions from 'utils/Permissions';
import { Select } from 'views/components/Select';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { PageLoading } from '../../../loading';
import GroupCard from './GroupCard';
import './GroupsSection.scss';
import { chainTypes, requirementTypes } from './constants';

const groupsFilter = ['All groups', 'In group', 'Not in group'];

type GroupCategory = 'All groups' | 'In group' | 'Not in group';
type GroupFilters = {
  searchText?: string;
  category?: GroupCategory;
};

const GroupsSection = () => {
  const navigate = useCommonNavigate();
  const { data: groups = [], isLoading } = useFetchGroupsQuery({
    chainId: app.activeChainId(),
    includeTopics: true,
    includeMembers: true,
  });
  const [groupFilters, setGroupFilters] = useState<GroupFilters>({
    searchText: '',
    category: 'All groups',
  });

  const getFilteredGroups = () => {
    return groups
      .filter((group) =>
        groupFilters.searchText
          ? group.name
              .toLowerCase()
              .includes(groupFilters.searchText.toLowerCase())
          : true
      )
      .filter((group) =>
        groupFilters.category === 'All groups'
          ? true
          : groupFilters.category === 'In group'
          ? (group as any).isJoined
          : !(group as any).isJoined
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
        {isLoading ? (
          <PageLoading />
        ) : (
          getFilteredGroups().map((group, index) => (
            <GroupCard
              key={index}
              groupName={group.name}
              groupDescription={group.description || 'jcvduhcvdhvhv'}
              requirements={group.requirements.map((r) => ({
                requirementType: requirementTypes.find(
                  (x) => x.value === r.data.source.source_type
                ).label,
                requirementChain:
                  chainTypes
                    .find(
                      (x) =>
                        `${x.value}` ===
                        `${
                          r?.data?.source?.evm_chain_id ||
                          r?.data?.source?.cosmos_chain_id ||
                          ''
                        }`
                    )
                    ?.label?.split('-')
                    ?.join(' ') || '{_chain_}',
                requirementContractAddress: r.data.source.contract_address,
                requirementAmount: r.data.threshold,
                requirementCondition: 'More than', // TODO: api doesn't return this
              }))}
              requirementsToFulfill={'ALL'} // TODO: api doesn't return this
              isJoined={(group.members || []).find(
                (x) => x?.address?.address === app.user.activeAccount.address
              )}
              topics={group.topics.map((x) => ({ id: x.id, name: x.name }))}
            />
          ))
        )}
      </section>
    </section>
  );
};

export default GroupsSection;
