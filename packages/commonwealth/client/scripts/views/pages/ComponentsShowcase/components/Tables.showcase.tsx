import React from 'react';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import {
  createColumnInfo,
  makeData,
} from 'views/components/component_kit/showcase_helpers';

const rowData = makeData(6);
const columnInfo = createColumnInfo();

const TablesShowcase = () => {
  return (
    <>
      <CWTable columnInfo={columnInfo} rowData={rowData} />
    </>
  );
};

export default TablesShowcase;
