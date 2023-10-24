import Group from 'client/scripts/models/Group';
import React from 'react';
import app from 'state';
import GroupCard from './GroupCard';
import './GroupsSection.scss';
import { chainTypes, requirementTypes } from './constants';

type GroupSectionProps = {
  groups: Group[];
};

const GroupsSection = ({ groups }: GroupSectionProps) => {
  return (
    <section className="GroupsSection">
      <section className="list-container">
        {groups.map((group, index) => (
          <GroupCard
            key={index}
            groupName={group.name}
            groupDescription={group.description || 'jcvduhcvdhvhv'}
            requirements={group.requirements.map((r) => ({
              requirementType: requirementTypes?.find(
                (x) => x.value === r?.data?.source?.source_type
              )?.label,
              requirementChain:
                chainTypes
                  .find(
                    (x) =>
                      `${x.value}` ===
                      `${r?.data?.source?.evm_chain_id ||
                      r?.data?.source?.cosmos_chain_id ||
                      ''
                      }`
                  )
                  ?.label?.split('-')
                  ?.join(' ') || '{_chain_}',
              requirementContractAddress: r.data.source.contract_address,
              requirementAmount: r.data.threshold,
              requirementCondition: 'More than', // hardcoded in api
            }))}
            requirementsToFulfill="ALL" // api doesn't return this
            isJoined={(group.members || []).find(
              (x) => x?.address?.address === app.user.activeAccount.address
            )}
            topics={group.topics.map((x) => ({ id: x.id, name: x.name }))}
          />
        ))}
      </section>
    </section>
  );
};

export default GroupsSection;