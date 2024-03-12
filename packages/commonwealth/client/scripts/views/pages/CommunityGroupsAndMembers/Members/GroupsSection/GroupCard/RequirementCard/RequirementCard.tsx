import React from 'react';
import { getClasses } from 'views/components/component_kit/helpers';
import { ERC_SPECIFICATIONS, TOKENS } from '../../../../common/constants';
import { InfoBlock } from './InfoBlock';
import './RequirementCard.scss';

type RequirementCardProps = {
  requirementType: string;
  requirementChain: string;
  requirementContractAddress?: string;
  requirementCondition: string;
  requirementAmount: string;
  requirementTokenId?: string;
};

const RequirementCard = ({
  requirementType,
  requirementChain,
  requirementContractAddress,
  requirementCondition,
  requirementAmount,
  requirementTokenId,
}: RequirementCardProps) => {
  const is1155Requirement = requirementType === ERC_SPECIFICATIONS.ERC_1155;
  const isTokenRequirement = Object.values(TOKENS).includes(requirementType);

  return (
    <div className="RequirementCard">
      <div className="row-1">
        <InfoBlock label="Requirement type" value={requirementType} />
      </div>

      {requirementType && (
        <div
          className={getClasses<{
            'cols-3'?: boolean;
            'cols-4'?: boolean;
            'cols-5'?: boolean;
            'row-1': boolean;
            'row-2': boolean;
          }>({
            'cols-3': isTokenRequirement,
            'cols-4': !isTokenRequirement && !is1155Requirement,
            'cols-5': !isTokenRequirement && is1155Requirement,
            'row-1': !isTokenRequirement && is1155Requirement,
            'row-2': !(!isTokenRequirement && is1155Requirement),
          })}
        >
          <InfoBlock label="Chain" value={requirementChain} />
          {!!requirementContractAddress && (
            <InfoBlock
              label="Contract address"
              value={requirementContractAddress}
            />
          )}
          <InfoBlock label="Condition" value={requirementCondition} />
          <InfoBlock label="Amount" value={requirementAmount} />
          {is1155Requirement && (
            <InfoBlock label="Id" value={requirementTokenId} />
          )}
        </div>
      )}
    </div>
  );
};

export default RequirementCard;
