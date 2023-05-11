import React, { useCallback, useEffect, useMemo, useState } from 'react';

import 'components/chain_entities_selector.scss';
import type ChainEntity from '../../../models/ChainEntity';

import app from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { ChainEntitiesSelectorItem } from 'views/components/chain_entities_selector/chain_entities_selector_item';
import { chainEntityTypeToProposalName } from 'identifiers';

const sortChainEntities = (a: ChainEntity, b: ChainEntity) => {
  if (!a.threadId && b.threadId) {
    return -1;
  }

  if (a.threadId && !b.threadId) {
    return 1;
  }

  return 0;
};

const filterChainEntities = (ce: ChainEntity, searchTerm: string) => {
  if (ce.typeId.startsWith('0x')) {
    return false;
  }

  return (
    ce.typeId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    ce.title?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
    chainEntityTypeToProposalName(ce.type)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
};

type ChainEntitiesSelectorProps = {
  proposalsToSet: Array<Pick<ChainEntity, 'typeId'>>;
  onSelect: ({ typeId }: { typeId: string }) => void;
};

export const ChainEntitiesSelector = ({
  onSelect,
  proposalsToSet,
}: ChainEntitiesSelectorProps) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chainEntities, setChainEntities] = useState<ChainEntity[]>([]);

  useEffect(() => {
    setLoading(true);
    app.chainEntities
      ?.refresh(app.chain.id)
      .then(() => {
        // refreshing loads the latest chain entities into app.chainEntities store
        setLoading(false);
        const entities = Array.from(app.chainEntities.store.values()).flat();
        setChainEntities(entities);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleClearButtonClick = () => {
    setSearchTerm('');
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const entities = useMemo(
    () =>
      chainEntities
        .sort(sortChainEntities)
        .filter((el) => filterChainEntities(el, searchTerm)),
    [chainEntities, searchTerm]
  );

  const renderItem = useCallback(
    (i: number, chainEntity: ChainEntity) => {
      const isSelected = !!proposalsToSet.find(
        (el) => String(el.typeId) === chainEntity.typeId
      );

      return (
        <ChainEntitiesSelectorItem
          chainEntity={chainEntity}
          isSelected={isSelected}
          onClick={(ce) => onSelect({ typeId: ce.typeId })}
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

      <QueryList loading={loading} options={entities} renderItem={renderItem} />
    </div>
  );
};
