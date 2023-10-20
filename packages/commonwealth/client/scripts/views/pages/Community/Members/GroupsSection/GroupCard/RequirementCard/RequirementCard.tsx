import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { getClasses } from 'views/components/component_kit/helpers';
import './RequirementCard.scss';

const InfoBlock = ({ label, value }) => {
  return (
    <div className="info-block">
      <CWText type="caption" fontWeight="bold">
        {label}
      </CWText>
      <CWText type="b2">{value}</CWText>
    </div>
  );
};

type RequirementCardProps = {
  requirementType: string;
  requirementChain: string;
  requirementContractAddress?: string;
  requirementCondition: string;
  requirementAmount: string;
};

const RequirementCard = ({
  requirementType,
  requirementChain,
  requirementContractAddress,
  requirementCondition,
  requirementAmount,
}: RequirementCardProps) => {
  return (
    <div className="RequirementCard">
      <div className="row-1">
        <InfoBlock label={'Requirement type'} value={requirementType} />
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
          <InfoBlock label={'Chain'} value={requirementChain} />
          {!!requirementContractAddress && (
            <InfoBlock
              label={'Contract address'}
              value={requirementContractAddress}
            />
          )}
          <InfoBlock label={'Condition'} value={requirementCondition} />
          <InfoBlock label={'Amount'} value={requirementAmount} />
        </div>
      )}
    </div>
  );
};

export default RequirementCard;
