import Group from 'models/Group';
import MinimumProfile from 'models/MinimumProfile';
import { useCommonNavigate } from 'navigation/helpers';
import React from 'react';
import app from 'state';
import { useFetchProfilesByAddressesQuery } from 'state/api/profiles/index';
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
  const navigate = useCommonNavigate();

  const profileAddresses = filteredGroups
    ?.map((g) => g.requirements) // Extract requirements from each group
    .filter((r) => r[0]?.rule === 'allow') // Filter only the allowlist rules
    .flatMap((r) => r[0]?.data?.allow || []); // Flatten and aggregate all addresses

  const communityId = app.activeChainId() || '';
  const { data: profiles } = useFetchProfilesByAddressesQuery({
    currentChainId: communityId,
    profileAddresses,
    profileChainIds: [communityId],
    apiCallEnabled: profileAddresses?.length > 0,
  });

  const profileMap = new Map<string, MinimumProfile>(
    profiles?.map((p) => [p.address, p]),
  );

  return (
    <section className="GroupsSection">
      {hasNoGroups && <TopicGatingHelpMessage />}

      {filteredGroups?.length > 0 && (
        <section className="list-container">
          {filteredGroups?.map((group, index) => (
            <GroupCard
              key={index}
              groupName={group.name}
              groupDescription={group.description}
              // @ts-expect-error <StrictNullChecks/>
              requirements={group.requirements
                .filter((r) => r?.data?.source) // filter erc groups
                .map((r) => ({
                  requirementType: requirementTypes?.find(
                    (x) => x.value === r?.data?.source?.source_type,
                  )?.label,
                  requirementChain:
                    chainTypes
                      ?.find(
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
                permissions: x.permissions,
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
