import React from 'react';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import './GroupCard.scss';
import RequirementCard from './RequirementCard/RequirementCard';

type RequirementCardProps = {
  requirementType: string;
  requirementChain: string;
  requirementContractAddress?: string;
  requirementCondition: string;
  requirementAmount: string;
};

type GroupCardProps = {
  isJoined?: boolean;
  groupName: string;
  groupDescription?: string;
  requirements: RequirementCardProps[];
  requirementsToFulfill: 'ALL' | number;
  topics: { id: number; name: string }[];
};

const GroupCard = ({
  isJoined,
  groupName,
  groupDescription,
  requirements,
  requirementsToFulfill,
  topics,
}: GroupCardProps) => {
  return (
    <section className="GroupCard">
      {/* Join status */}
      <CWTag
        type={isJoined ? 'passed' : 'referendum'}
        label={isJoined ? 'In group' : 'Not in group'}
      />

      {/* Name and description */}
      <CWText type="h3">{groupName}</CWText>
      {groupDescription && <CWText type="b2">{groupDescription}</CWText>}

      <CWDivider />

      {/* Sub requirements */}
      <CWText type="h5">Requirements</CWText>
      <CWText type="b2">
        {requirementsToFulfill === 'ALL'
          ? 'All requirements must be satisfied'
          : `At least ${requirementsToFulfill} # of all requirements`}
      </CWText>
      {requirements.map((r, index) => (
        <RequirementCard key={index} {...r} />
      ))}

      {/* Gated topics */}
      <CWText type="h5">Gated Topics</CWText>
      <div className="gating-tags">
        {topics.map((t, index) => (
          <CWTag key={index} label={t.name} type="referendum" />
        ))}
      </div>
    </section>
  );
};

export default GroupCard;
