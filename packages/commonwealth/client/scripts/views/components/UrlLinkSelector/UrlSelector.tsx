import React, { useCallback } from 'react';

import { Link } from 'models/Thread';
import app from 'state';
import { QueryList } from 'views/components/component_kit/cw_query_list';
import './UrlLinkSelector.scss';
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
        ({ identifier }) => identifier === url.identifier,
      );

      return (
        <div className="linked-url-item">
          <UrlSelectorItem
            link={url}
            onClick={() => onSelect(url)}
            isSelected={isSelected}
          />
        </div>
      );
    },
    [onSelect, urlsToSet],
  );

  if (!app.chain || !app.activeChainId()) {
    return;
  }

  // eslint-disable-next-line react/no-multi-comp
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
