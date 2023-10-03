import React from 'react';
import { CWCheck } from 'views/components/component_kit/cw_icons/cw_icons';
import { chainEntityTypeToProposalName } from 'identifiers';
import type ChainEntity from '../../../models/ChainEntity';
import { CWText } from '../component_kit/cw_text';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';
import { IChainEntityKind } from 'chain-events/src';

interface ChainEntitiesSelectorItemProps {
  chainEntity: IAaveProposalResponse | ICompoundProposalResponse;
  isSelected: boolean;
  onClick: (
    chainEntity: IAaveProposalResponse | ICompoundProposalResponse
  ) => void;
}

const ChainEntitiesSelectorItem = ({
  onClick,
  chainEntity,
  isSelected,
}: ChainEntitiesSelectorItemProps) => {
  return (
    <div className="chain-entity" onClick={() => onClick(chainEntity)}>
      <div className="selected">{isSelected && <CWCheck />}</div>
      <div className="text">
        <CWText fontWeight="medium" truncate noWrap>
          {chainEntityTypeToProposalName('proposal' as IChainEntityKind) +
            (chainEntity.identifier.startsWith('0x')
              ? ` ${chainEntity.identifier.slice(0, 6)}...`
              : ` #${chainEntity.identifier}`)}
        </CWText>
      </div>
    </div>
  );
};

export { ChainEntitiesSelectorItem };
