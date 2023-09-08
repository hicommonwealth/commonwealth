import React from 'react';
import type { StoryObj } from '@storybook/react';

import { CWSearchBar } from '../../../client/scripts/views/components/component_kit/new_designs/CWSearchBar';

const searchbar = {
  title: 'Components/SearchBar',
  component: CWSearchBar,
};

export default searchbar;
type Story = StoryObj<typeof searchbar>;

export const SearchBar: Story = {
  args: {
    placeholder: 'Search Common',
    disabled: false,
  },
  parameters: {
    controls: {
      exclude: [
        'autoComplete',
        'autoFocus',
        'containerClassName',
        'defaultValue',
        'value',
        'iconLeft',
        'iconLeftonClick',
        'inputValidationFn',
        'label',
        'name',
        'onInput',
        'onenterkey',
        'onClick',
        'tabIndex',
        'manualStatusMessage',
        'manualValidationStatus',
        'inputClassName',
        'displayOnly',
        'hasLeftIcon',
        'maxLength',
        'isTyping',
      ],
    },
  },
  render: (args) => <CWSearchBar {...args} />,
};
