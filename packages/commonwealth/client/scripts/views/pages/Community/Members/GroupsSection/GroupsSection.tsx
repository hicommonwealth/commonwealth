import Group from 'models/Group';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import { chainTypes, requirementTypes } from '../../common/constants';
import GroupCard from './GroupCard';
import './GroupsSection.scss';

type GroupSectionProps = {
  filteredGroups: Group[];
  canManageGroups?: boolean;
  hasNoGroups?: boolean;
};

const GroupsSection = ({
  filteredGroups,
  canManageGroups,
  hasNoGroups,
}: GroupSectionProps) => {
  const navigate = useCommonNavigate();

  return (
    <section className="GroupsSection">
      {hasNoGroups && (
        <div className="empty-groups-container">
          <CWIcon iconName="members" iconSize="xxl" className="members-icon" />
          <CWText type="h4" className="header">
            {app.activeChainId()} does not have any groups
          </CWText>
          <CWText type="b1" className="description">
            Create a group to gate discussion topics
          </CWText>
          {canManageGroups && (
            <CWButton
              className="cta-btn"
              buttonWidth="narrow"
              label="Create group"
              iconLeft="plus"
              onClick={() => navigate(`/members/groups/create`)}
            />
          )}
        </div>
      )}
      {filteredGroups.length > 0 && (
        <section className="list-container">
          {filteredGroups.map((group, index) => (
            <GroupCard
              key={index}
              groupName={group.name}
              groupDescription={group.description}
              requirements={group.requirements.map((r) => ({
                requirementType: requirementTypes?.find(
                  (x) => x.value === r?.data?.source?.source_type
                )?.label,
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
                    ?.join(' ') || '',
                requirementContractAddress: r.data.source.contract_address,
                requirementAmount: r.data.threshold,
                requirementCondition: 'More than', // hardcoded in api
              }))}
              requirementsToFulfill={
                group.requirementsToFulfill === group.requirements.length
                  ? 'ALL'
                  : group.requirementsToFulfill
              }
              isJoined={(group.members || []).find(
                (x) => x?.address?.address === app.user.activeAccount.address
              )}
              topics={group.topics.map((x) => ({ id: x.id, name: x.name }))}
              canEdit={canManageGroups}
              onEditClick={() => navigate(`/members/groups/${group.id}/update`)}
            />
          ))}
        </section>
      )}
    </section>
  );
};

export default GroupsSection;
