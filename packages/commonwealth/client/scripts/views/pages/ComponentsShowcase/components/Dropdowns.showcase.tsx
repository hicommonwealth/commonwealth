import React from 'react';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWSelectList } from 'views/components/component_kit/new_designs/CWSelectList';
import { CWTypeaheadSelectList } from 'views/components/component_kit/new_designs/CWTypeaheadSelectList';

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

const DropdownsShowcase = () => {
  return (
    <>
      <CWText type="h5">Regular</CWText>
      <CWSelectList
        placeholder="Add or select a chain"
        isClearable={false}
        isSearchable={false}
        options={optionList}
        onChange={(newValue) => {
          console.log('selected value is: ', newValue.label);
        }}
      />

      <CWText type="h5">Typeahead</CWText>
      <CWTypeaheadSelectList
        options={optionList}
        defaultValue={optionList[0]}
        placeholder="Select chain"
        isDisabled={false}
      />
    </>
  );
};

export default DropdownsShowcase;
