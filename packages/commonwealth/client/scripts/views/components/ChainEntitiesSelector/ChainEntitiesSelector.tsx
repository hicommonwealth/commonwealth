import React, { useCallback, useEffect, useMemo, useState } from 'react';

import 'components/ChainEntitiesSelector.scss';
import type ChainEntity from '../../../models/ChainEntity';

import app from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { ChainEntitiesSelectorItem } from 'views/components/ChainEntitiesSelector';
import { filterChainEntities } from 'views/components/ChainEntitiesSelector/utils';
import { useRawAaveProposalsQuery } from 'state/api/proposals';
import { IAaveProposalResponse } from 'adapters/chain/aave/types';
import { ICompoundProposalResponse } from 'adapters/chain/compound/types';

type ChainEntitiesSelectorProps = {
  proposalsToSet: Array<
    Pick<IAaveProposalResponse | ICompoundProposalResponse, 'identifier'>
  >;
  onSelect: ({ identifier }: { identifier: string }) => void;
};

export const ChainEntitiesSelector = ({
  onSelect,
  proposalsToSet,
}: ChainEntitiesSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [proposals, setProposals] = useState<IAaveProposalResponse[]>([]);

  const { data: aaveProposals, isLoading } = useRawAaveProposalsQuery({
    chainId: app.chain.id,
    chainNetwork: app.chain.network,
  });

  const handleClearButtonClick = () => {
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  useMemo(() => {
    if (aaveProposals) {
      setProposals(
        aaveProposals
          .sort((a, b) => b.id - a.id)
          .filter((prop) =>
            prop.identifier.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }
  }, [aaveProposals, searchTerm]);

  const renderItem = useCallback(
    (i: number, chainEntity: IAaveProposalResponse) => {
      const isSelected = !!proposalsToSet.find(
        (el) => String(el.identifier) === chainEntity.identifier
      );

      return (
        <ChainEntitiesSelectorItem
          chainEntity={chainEntity}
          isSelected={isSelected}
          onClick={(ce) => onSelect({ identifier: ce.identifier })}
        />
      );
    },
    [onSelect, proposalsToSet]
  );

  if (!app.chain || !app.activeChainId()) {
    return;
  }

  return (
    <div className="ChainEntitiesSelector">
      <CWTextInput
        placeholder="Search for an existing proposal..."
        iconRightonClick={handleClearButtonClick}
        value={searchTerm}
        iconRight="close"
        onInput={handleInputChange}
      />

      <QueryList
        loading={isLoading}
        options={proposals}
        renderItem={renderItem}
      />
    </div>
  );
};
