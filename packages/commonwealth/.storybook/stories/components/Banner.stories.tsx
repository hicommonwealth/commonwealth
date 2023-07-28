import React, { useState } from 'react';
import CWBanner from '../../../client/scripts/views/components/component_kit/new_designs/CWBanner';
import { CWButton } from '../../../client/scripts/views/components/component_kit/new_designs/cw_button';

const bannerStories = {
  title: 'Components/Banner',
  component: CWBanner,
};

export default bannerStories;

const BannerComponent = ({ type, title, body, ...args }) => {
  const [isVisible, setIsVisible] = useState(true);

  return isVisible ? (
    <CWBanner
      type={type}
      title={title || 'Title'}
      body={body || 'More information about this message'}
      buttons={[
        { label: args['primary button label'] || 'Primary Action' },
        { label: args['secondary button label'] || 'Secondary action' },
      ]}
      onClose={() => setIsVisible(false)}
      {...args}
    />
  ) : (
    <CWButton label="Show banner" onClick={() => setIsVisible(true)} />
  );
};

export const Banner = {
  args: {
    type: 'default',
    'primary button label': '',
    'secondary button label': '',
  },
  parameters: {
    controls: { exclude: ['buttons', 'className', 'onClose'] },
  },
  render: BannerComponent,
};
