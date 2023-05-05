import React, { FC, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { AvatarUpload } from '../../../client/scripts/views/components/avatar_upload';

const avatarUpload = {
  title: 'Molecules/AvatarUpload',
  component: AvatarUpload,
} satisfies Meta<typeof AvatarUpload>;

export default avatarUpload;
// type Story = StoryObj<typeof avatarUpload>;

// export const AvatarUploadRegular: Story = {
export const AvatarUploadRegular = {
  name: 'Regular',
  render: () => <AvatarUpload scope="community" />
}

// export const AvatarUploadRegular: Story = {
export const AvatarUploadLarge = {
  name: 'Large',
  render: () => <AvatarUpload size="large" scope="community" />
}

