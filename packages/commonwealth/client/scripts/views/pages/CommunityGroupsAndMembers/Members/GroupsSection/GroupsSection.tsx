import Group from 'models/Group';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { useFlag } from '../../../../../hooks/useFlag';
import MinimumProfile from '../../../../../models/MinimumProfile';
import { useFetchProfilesByAddressesQuery } from '../../../../../state/api/profiles/index';
import TopicGatingHelpMessage from '../../Groups/TopicGatingHelpMessage/index';
import { chainTypes, requirementTypes } from '../../common/constants';
import { convertRequirementAmountFromWeiToTokens } from '../../common/helpers';
import GroupCard from './GroupCard';
import './GroupsSection.scss';

type GroupSectionProps = {
  filteredGroups: (Group & { isJoined?: boolean })[];
  canManageGroups?: boolean;
  hasNoGroups?: boolean;
};

const GroupsSection = ({
  filteredGroups,
  canManageGroups,
  hasNoGroups,
}: GroupSectionProps) => {
  console.log(filteredGroups);
  const allowlistEnabled = useFlag('allowlist');
  const navigate = useCommonNavigate();

  const profileAddresses = filteredGroups
    ?.map((g) => g.requirements) // Extract requirements from each group
    .filter((r) => r[0]?.rule === 'allow') // Filter only the allowlist rules
    .flatMap((r) => r[0]?.data?.allow || []); // Flatten and aggregate all addresses

  const { data: profiles } = useFetchProfilesByAddressesQuery({
    currentChainId: app.activeChainId(),
    profileAddresses,
    profileChainIds: [app.activeChainId()],
    apiCallEnabled: profileAddresses?.length > 0,
  });

  const profileMap = new Map<string, MinimumProfile>(
    profiles?.map((p) => [p.address, p]),
  );

  return (
    <section className="GroupsSection">
      {hasNoGroups && allowlistEnabled && <TopicGatingHelpMessage />}
      {hasNoGroups && !allowlistEnabled && (
        <div className="empty-groups-container">
          <CWIcon iconName="members" iconSize="xxl" className="members-icon" />
          <CWText type="h4" className="header">
            <span className="capitalize">{app.activeChainId()}</span>&nbsp;does
            not have any groups
          </CWText>
          <CWText type="b1" className="description">
            Admins can create groups to gate discussion topics
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
      {filteredGroups?.length > 0 && (
        <section className="list-container">
          {filteredGroups?.map((group, index) => (
            <GroupCard
              key={index}
              groupName={group.name}
              groupDescription={group.description}
              requirements={group.requirements
                .filter((r) => r?.data?.source) // filter erc groups
                .map((r) => ({
                  requirementType: requirementTypes?.find(
                    (x) => x.value === r?.data?.source?.source_type,
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
                          }`,
                      )
                      ?.label?.split('-')
                      ?.join(' ') || '',
                  requirementContractAddress: r.data.source.contract_address,
                  requirementTokenId: r.data.source.token_id,
                  requirementAmount: `${convertRequirementAmountFromWeiToTokens(
                    r?.data?.source?.source_type,
                    r.data.threshold,
                  )}`,
                  requirementCondition: 'More than', // hardcoded in api
                }))}
              requirementsToFulfill={
                group.requirementsToFulfill === group.requirements.length
                  ? 'ALL'
                  : group.requirementsToFulfill
              }
              allowLists={
                group.requirements?.find((r) => r.rule === 'allow')?.data?.allow
              }
              profiles={profileMap}
              isJoined={group.isJoined}
              topics={(group?.topics || []).map((x) => ({
                id: x.id,
                name: x.name,
              }))}
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
