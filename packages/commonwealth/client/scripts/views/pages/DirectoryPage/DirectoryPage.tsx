import React, { useState } from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import {
  createColumnInfo,
  makeData,
} from 'views/components/component_kit/showcase_helpers';

import { MagnifyingGlass } from '@phosphor-icons/react';
import clsx from 'clsx';
import { useCommonNavigate } from 'navigation/helpers';
import app from 'state';
import { CWIconButton } from 'views/components/component_kit/cw_icon_button';
import { CWRelatedCommunityCard } from 'views/components/component_kit/new_designs/CWRelatedCommunityCard';
import { CWTextInput } from 'views/components/component_kit/new_designs/CWTextInput';
import ErrorPage from 'views/pages/error';
import './DirectoryPage.scss';

const rowData = makeData(25);
const columnInfo = createColumnInfo();

enum ViewType {
  Rows = 'Rows',
  Tiles = 'Tiles',
}

const DirectoryPage = () => {
  const navigate = useCommonNavigate();
  const [communitySearch, setCommunitySearch] = useState('');
  const [selectedViewType, setSelectedViewType] = useState(ViewType.Rows);

  const handleCreateCommunity = () => {
    navigate('/createCommunity/starter', {}, null);
  };

  const directoryPageEnabled = app.config.chains.getById(
    app.activeChainId()
  )?.directoryPageEnabled;

  if (!directoryPageEnabled) {
    return (
      <ErrorPage message="Directory Page is not enabled for this community." />
    );
  }

  return (
    <div className="DirectoryPage">
      <div className="header-row">
        <CWText type="h2"> Directory</CWText>
        <CWButton
          label="Create community"
          iconLeft="plus"
          onClick={handleCreateCommunity}
        />
      </div>
      <CWText className="page-description">
        Access relevant communities linked to your base chain for a connected
        experience.
      </CWText>
      <CWDivider />
      <CWText type="h4" className="subtitle">
        [Base chain] ecosystem
      </CWText>
      <div className="search-row">
        <div className="community-search">
          <CWTextInput
            value={communitySearch}
            onInput={(e: any) => setCommunitySearch(e.target.value)}
            fullWidth
            placeholder="Search communities"
            iconLeft={<MagnifyingGlass size={24} weight="regular" />}
          />
        </div>
        <div className="toggle-view-icons">
          <div
            className={clsx('icon-container', {
              selected: selectedViewType === ViewType.Rows,
            })}
          >
            <CWIconButton
              onClick={() => setSelectedViewType(ViewType.Rows)}
              iconName="rows"
              weight="light"
            />
          </div>
          <div
            className={clsx('icon-container', {
              selected: selectedViewType === ViewType.Tiles,
            })}
          >
            <CWIconButton
              onClick={() => setSelectedViewType(ViewType.Tiles)}
              iconName="squaresFour"
              weight="light"
            />
          </div>
        </div>
      </div>

      {selectedViewType === ViewType.Rows ? (
        <CWTable columnInfo={columnInfo} rowData={rowData} />
      ) : (
        <div className="tiles-container">
          {rowData.map((community, index) => (
            <CWRelatedCommunityCard
              key={`${community.name}-${index}`}
              communityName={community.name}
              communityDescription={community.description}
              communityIconUrl={community.avatars.name}
              memberCount={community.members}
              threadCount={community.threads}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectoryPage;
