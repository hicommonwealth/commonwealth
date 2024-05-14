import React from 'react';
import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';
import MinimumProfile from '../../../../../../models/MinimumProfile';
import './GroupCard.scss';
import RequirementCard from './RequirementCard/RequirementCard';

type RequirementCardProps = {
  requirementType: string;
  requirementChain: string;
  requirementContractAddress?: string;
  requirementCondition: string;
  requirementAmount: string;
  requirementTokenId?: string;
};

type GroupCardProps = {
  isJoined?: boolean;
  groupName: string;
  groupDescription?: string;
  requirements?: RequirementCardProps[]; // This represents erc requirements
  requirementsToFulfill: 'ALL' | number;
  allowLists?: number[];
  topics: { id: number; name: string }[];
  canEdit?: boolean;
  onEditClick?: () => any;
  profiles?: MinimumProfile[];
};

const GroupCard = ({
  isJoined,
  groupName,
  groupDescription,
  requirements,
  requirementsToFulfill,
  allowLists,
  topics,
  canEdit,
  onEditClick = () => {},
  profiles,
}: GroupCardProps) => {
  console.log(allowLists);
  return (
    <section className="GroupCard">
      {/* Join status */}
      <CWTag
        type={isJoined ? 'passed' : 'referendum'}
        label={isJoined ? 'In group' : 'Not in group'}
      />

      {/* Name and description */}
      <div className="group-name-row">
        <CWText type="h3" className="group-name-text">
          {groupName}
        </CWText>
        {canEdit && (
          <button className="group-edit-button" onClick={onEditClick}>
            <CWIcon iconName="notePencil" iconSize="medium" />
            <CWText type="caption">Edit</CWText>
          </button>
        )}
      </div>
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

      {/* Allow list */}
      <CWText type="h5">Allow List</CWText>
      <CWText type="b2">
        These users are added directly to the group and may bypass additional
        requirements
      </CWText>

      {/* Gated topics */}
      {topics.length > 0 && (
        <>
          <CWText type="h5">Gated Topics</CWText>
          <div className="gating-tags">
            {topics.map((t, index) => (
              <CWTag key={index} label={t.name} type="referendum" />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default GroupCard;
