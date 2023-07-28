import React, { useState } from 'react';
import CWBanner from '../../../client/scripts/views/components/component_kit/new_designs/CWBanner';
import { CWButton } from '../../../client/scripts/views/components/component_kit/new_designs/cw_button';

const alertStories = {
  title: 'Components/Alert',
  component: CWBanner,
};

export default alertStories;

const AlertComponent = ({ type, title, body, ...args }) => {
  const [isVisible, setIsVisible] = useState(true);

  return isVisible ? (
    <CWBanner
      type={type}
      title={title || 'Title'}
      body={body || 'More information about this message'}
      onClose={() => setIsVisible(false)}
      {...args}
    />
  ) : (
    <CWButton label="Show alert" onClick={() => setIsVisible(true)} />
  );
};

export const Alert = {
  args: {
    type: 'default',
    'primary button label': '',
    'secondary button label': '',
  },
  parameters: {
    controls: { exclude: ['buttons', 'className', 'onClose'] },
  },
  render: AlertComponent,
};
