import { S3_ASSET_BUCKET_CDN } from '@hicommonwealth/shared';
import { APIOrderDirection } from 'helpers/constants';
import React from 'react';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
import { CWTableColumnInfo } from 'views/components/component_kit/new_designs/CWTable/CWTable';
import { useCWTableState } from 'views/components/component_kit/new_designs/CWTable/useCWTableState';
import { CWTag } from 'views/components/component_kit/new_designs/CWTag';

const tagTypes = [
  'passed',
  'failed',
  'active',
  'poll',
  'proposal',
  'referendum',
  'disabled',
];

const buttonTypes = ['primary', 'secondary', 'tertiary', 'destructive'];

const iconNames = ['cloud', 'mail', 'sun', 'cow'];

const range = (len: number) => {
  const arr = [];
  for (let i = 0; i < len; i++) {
    // @ts-expect-error <StrictNullChecks/>
    arr.push(i);
  }
  return arr;
};

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const newCommunity = (): any => {
  const tagType = getRandomElement(tagTypes);
  const iconName = getRandomElement(iconNames);
  const buttonType = getRandomElement(buttonTypes);

  return {
    name: 'fake company name',
    description: 'fake description',
    members: Math.floor(Math.random() * 1000),
    threads: Math.floor(Math.random() * 1000),
    tags: <CWTag label={tagType} iconName={iconName} type={tagType} />,
    buttons: (
      <CWButton label="button" buttonType={buttonType} iconLeft={iconName} />
    ),
    avatars: {
      name: {
        avatarUrl: `https://${S3_ASSET_BUCKET_CDN}/f5c5a0c6-0552-40be-bb4b-b25fbd0cfbe2.png`,
      },
    },
  };
};

const makeData = (num: number) => {
  return range(num).map((): any => {
    return {
      ...newCommunity(),
    };
  });
};

const rowData = makeData(6);

const columns: CWTableColumnInfo[] = [
  {
    key: 'name',
    header: 'Community',
    numeric: false,
    sortable: true,
  },
  {
    key: 'description',
    header: 'Description',
    numeric: false,
    sortable: true,
  },
  {
    key: 'members',
    header: 'Members',
    numeric: true,
    sortable: true,
  },
  {
    key: 'threads',
    header: 'Threads',
    numeric: true,
    sortable: true,
  },
  {
    key: 'tags',
    header: 'Tags',
    numeric: false,
    sortable: false,
  },
  {
    key: 'buttons',
    header: 'Buttons',
    numeric: false,
    sortable: false,
  },
];

const TablesShowcase = () => {
  const tableState = useCWTableState({
    columns,
    initialSortColumn: 'members',
    initialSortDirection: APIOrderDirection.Desc,
  });

  return (
    <>
      <CWTable
        columnInfo={tableState.columns}
        sortingState={tableState.sorting}
        setSortingState={tableState.setSorting}
        rowData={rowData}
      />
    </>
  );
};

export default TablesShowcase;
