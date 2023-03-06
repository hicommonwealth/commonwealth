import React from 'react';
import { CWCheck } from 'views/components/component_kit/cw_icons/cw_icons';
import { chainEntityTypeToProposalName } from 'identifiers';
import type { ChainEntity } from 'models';

interface ChainEntitiesSelectorItemProps {
  chainEntity: ChainEntity;
  isSelected: boolean;
  onClick: (chainEntity: ChainEntity) => void;
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
        <div className="chain-entity-text">
          {chainEntityTypeToProposalName(chainEntity.type) +
            (chainEntity.typeId.startsWith('0x')
              ? ` ${chainEntity.typeId.slice(0, 6)}...`
              : ` #${chainEntity.typeId}`)}
        </div>
        <div className="chain-entity-subtext">
          {chainEntity.threadTitle !== 'undefined'
            ? decodeURIComponent(chainEntity.threadTitle)
            : 'No thread title'}
        </div>
      </div>
    </div>
  );
};

export { ChainEntitiesSelectorItem };
