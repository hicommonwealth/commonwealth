import React, { useCallback, useState } from 'react';

import 'components/UrlLinkSelector.scss';
import app from 'state';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import { Link } from 'models/Thread';
import { UrlSelectorItem } from './UrlSelectorItem';

type UrlSelectorProps = {
  onSelect: (link: Link) => void;
  urlsToSet: Pick<Link, 'identifier'>[];
};

export const UrlSelector = ({ onSelect, urlsToSet }: UrlSelectorProps) => {
  const getEmptyContentMessage = () => {
    if (!urlsToSet?.length) {
      return 'No linked URLs yet';
    }
  };

  const renderItem = useCallback(
    (i: number, url: Link) => {
      const isSelected = !!urlsToSet.find(
        ({ identifier }) => identifier === url.identifier
      );

      return (
        <UrlSelectorItem
          link={url}
          onClick={() => onSelect(url)}
          isSelected={isSelected}
        />
      );
    },
    [onSelect, urlsToSet]
  );

  if (!app.chain || !app.activeChainId()) {
    return;
  }

  const EmptyComponent = () => (
    <div className="empty-component">{getEmptyContentMessage()}</div>
  );

  return (
    <div className="UrlLinkSelector">
      <QueryList
        loading={false}
        options={urlsToSet}
        components={{ EmptyPlaceholder: EmptyComponent }}
        renderItem={renderItem}
      />
    </div>
  );
};
