import faker from 'faker';
import React from 'react';
import { CWTag } from '../../components/component_kit/new_designs/CWTag';
import { CWButton } from './new_designs/cw_button';

// CWTypeaheadSelectList
export const optionList = [
  { value: '1inch', label: '1 Inch' },
  { value: 'atom-blockchain', label: 'Atom Blockchain' },
  { value: 'dydx', label: 'dydx' },
  { value: 'edgeware', label: 'Edgeware' },
  { value: 'maia-dao', label: 'Maia Dao' },
  { value: 'oraichain', label: 'Oraichain' },
  { value: 'stargate-finance', label: 'Stargate Finance' },
  { value: 'stargaze', label: 'Stargaze' },
  { value: 'terra-classic', label: 'Terra Classic' },
];

// CWTable
const range = (len: number) => {
  const arr = [];
  for (let i = 0; i < len; i++) {
    arr.push(i);
  }
  return arr;
};

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

export function makeData(num: number) {
  return range(num).map((): any => {
    return {
      ...newCommunity(),
    };
  });
}

export function createColumnInfo() {
  return [
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
}
