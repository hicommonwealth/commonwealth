import React from 'react';

import { CWDivider } from 'views/components/component_kit/cw_divider';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWSearchBar } from 'views/components/component_kit/new_designs/CWSearchBar';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWButton } from 'views/components/component_kit/new_designs/cw_button';
import {
  createColumnInfo,
  makeData,
} from 'views/components/component_kit/showcase_helpers';

import { useCommonNavigate } from 'navigation/helpers';
import ErrorPage from 'views/pages/error';
import './DirectoryPage.scss';

const rowData = makeData(25);
const columnInfo = createColumnInfo();

const DirectoryPage = () => {
  const navigate = useCommonNavigate();

  const handleCreateCommunity = () => {
    navigate('/createCommunity/starter', {}, null);
  };

  // TODO make this value dynamic
  const isDirectoryPageEnabled = true;

  if (!isDirectoryPageEnabled) {
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
      {/*// TODO refactor CWSearchBar*/}
      <div className="community-search">
        <CWSearchBar />
      </div>

      <CWTable columnInfo={columnInfo} rowData={rowData} />
    </div>
  );
};

export default DirectoryPage;
