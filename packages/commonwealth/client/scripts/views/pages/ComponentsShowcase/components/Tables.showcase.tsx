import { APIOrderDirection } from 'client/scripts/helpers/constants';
import { useCWTableState } from 'client/scripts/views/components/component_kit/new_designs/CWTable/useCWTableState';
import faker from 'faker';
import React from 'react';
import { CWButton } from 'views/components/component_kit/new_designs/CWButton';
import { CWTable } from 'views/components/component_kit/new_designs/CWTable';
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
    arr.push(i);
  }
  return arr;
};

const newCommunity = (): any => {
  const tagType = faker.helpers.shuffle(tagTypes)[0];
  const iconName = faker.helpers.shuffle(iconNames)[0];
  const buttonType = faker.helpers.shuffle(buttonTypes)[0];

  return {
    name: faker.company.companyName(),
    description: faker.lorem.paragraph(),
    members: faker.random.number(1000),
    threads: faker.random.number(1000),
    tags: <CWTag label={tagType} iconName={iconName} type={tagType} />,
    buttons: (
      <CWButton label="button" buttonType={buttonType} iconLeft={iconName} />
    ),
    avatars: {
      name: {
        avatarUrl:
          'https://assets.commonwealth.im/f5c5a0c6-0552-40be-bb4b-b25fbd0cfbe2.png',
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

const TablesShowcase = () => {
  const tableState = useCWTableState({
    columns: [
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
    ],
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
