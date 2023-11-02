import React from 'react';
import { getClasses } from 'views/components/component_kit/helpers';
import { InfoBlock } from './InfoBlock';
import './RequirementCard.scss';

type RequirementCardProps = {
  requirementType: string;
  requirementChain: string;
  requirementContractAddress?: string;
  requirementCondition: string;
  requirementAmount: string;
  requirementTokenId?: string,
};

const RequirementCard = ({
  requirementType,
  requirementChain,
  requirementContractAddress,
  requirementCondition,
  requirementAmount,
  requirementTokenId,
}: RequirementCardProps) => {
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
          }>(
            {
              'cols-3': !requirementContractAddress,
              'cols-4': !!requirementContractAddress,
            },
            `row-2`
          )}
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
          <InfoBlock label="Id" value={requirementTokenId} />
        </div>
      )}
    </div>
  );
};

export default RequirementCard;
