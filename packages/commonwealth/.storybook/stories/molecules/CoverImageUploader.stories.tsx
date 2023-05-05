import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { CWCoverImageUploader } from '../../../client/scripts/views/components/component_kit/cw_cover_image_uploader';
import { notifySuccess } from '../../../client/scripts/controllers/app/notifications';

const coverImageUploader = {
  title: 'Organisms/CoverImageUploader',
  component: CWCoverImageUploader,
} satisfies Meta<typeof CWCoverImageUploader>;

export default coverImageUploader;
// type Story = StoryObj<typeof coverImageUploader>;

// export const ImageUpload: Story = {
export const ImageUpload  = {
  name: 'Image Upload ',
  render: () => (
    <CWCoverImageUploader
      uploadCompleteCallback={(url: string) => {
        notifySuccess(`Image uploaded to ${url.slice(0, 18)}...`);
      }}
      enableGenerativeAI
    />
  )
}
