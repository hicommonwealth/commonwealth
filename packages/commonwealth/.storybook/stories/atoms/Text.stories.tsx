import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';
import '../../../client/styles/components/component_kit/cw_component_showcase.scss';

const text = {
  title: 'Atoms/Text',
  component: CWText,
} satisfies Meta<typeof CWText>;

export default text;
type Story = StoryObj<typeof text>;

/** Display1 */
export const Display1SemiBold: Story = {
  name: 'Display1 semi bold',
  render: () => (
    <CWText fontWeight="semiBold" type="d1">
      Display1 semi bold
    </CWText>
  ),
};

export const Display1bold: Story = {
  name: 'Display1 bold',
  render: () => (
    <CWText type="d1" fontWeight="bold">
      Display1 bold
    </CWText>
  ),
};

export const Display1black: Story = {
  name: 'Display1 black',
  render: () => (
    <CWText type="d1" fontWeight="black">
      Display1 black
    </CWText>
  ),
};

/** Display2 */
export const Display2SemiBold: Story = {
  name: 'Display2 semi bold',
  render: () => (
    <CWText type="d2" fontWeight="semiBold">
      Display2 semi bold
    </CWText>
  ),
};

export const Display2Bold: Story = {
  name: 'Display2 bold',
  render: () => (
    <CWText type="d2" fontWeight="bold">
      Display2 bold
    </CWText>
  ),
};

export const Display2Black: Story = {
  name: 'Display2 black',
  render: () => (
    <CWText type="d2" fontWeight="black">
      Display2 black
    </CWText>
  ),
};

/** Heading1 */
export const Heading1Medium: Story = {
  name: 'Heading1 medium',
  render: () => (
    <CWText type="h1" fontWeight="medium">
      Heading1 medium
    </CWText>
  ),
};

export const Heading1SemiBold: Story = {
  name: 'Heading1 semi bold',
  render: () => (
    <CWText type="h1" fontWeight="semiBold">
      Heading1 semi bold
    </CWText>
  ),
};

export const Heading1Bold: Story = {
  name: 'Heading1 bold',
  render: () => (
    <CWText type="h1" fontWeight="bold">
      Heading1 bold
    </CWText>
  ),
};

/** Heading2 */
export const Heading2Medium: Story = {
  name: 'Heading2 medium',
  render: () => (
    <CWText type="h2" fontWeight="medium">
      Heading2 medium
    </CWText>
  ),
};

export const Heading2SemiBold: Story = {
  name: 'Heading2 semi bold',
  render: () => (
    <CWText type="h2" fontWeight="semiBold">
      Heading2 semi bold
    </CWText>
  ),
};

export const Heading2Bold: Story = {
  name: 'Heading2 bold',
  render: () => (
    <CWText type="h2" fontWeight="bold">
      Heading2 bold
    </CWText>
  ),
};

/** Heading3 */
export const Heading3Medium: Story = {
  name: 'Heading3 medium',
  render: () => (
    <CWText type="h3" fontWeight="medium">
      Heading3 medium
    </CWText>
  ),
};

export const Heading3SemiBold: Story = {
  name: 'Heading3 semi bold',
  render: () => (
    <CWText type="h3" fontWeight="semiBold">
      Heading3 semi bold
    </CWText>
  ),
};

export const Heading3Bold: Story = {
  name: 'Heading3 bold',
  render: () => (
    <CWText type="h3" fontWeight="bold">
      Heading3 bold
    </CWText>
  ),
};

export const Heading4Medium: Story = {
  name: 'Heading4 medium',
  render: () => (
    <CWText fontWeight="medium" type="h4">
      Heading4 medium
    </CWText>
  ),
};

export const Heading4SemiBold: Story = {
  name: 'Heading4 semi bold',
  render: () => (
    <CWText type="h4" fontWeight="semiBold">
      Heading4 semi bold
    </CWText>
  ),
};

export const Heading4Bold: Story = {
  name: 'Heading4 bold',
  render: () => (
    <CWText type="h4" fontWeight="bold">
      Heading4 bold
    </CWText>
  ),
};

export const Heading5Medium: Story = {
  name: 'Heading5 medium',
  render: () => (
    <CWText fontWeight="medium" type="h5">
      Heading5 medium
    </CWText>
  ),
};

export const Heading5SemiBold: Story = {
  name: 'Heading5 semi bold',
  render: () => (
    <CWText type="h5" fontWeight="semiBold">
      Heading5 semi bold
    </CWText>
  ),
};

export const Heading5Bold: Story = {
  name: 'Heading5 bold',
  render: () => (
    <CWText type="h5" fontWeight="bold">
      Heading5 bold
    </CWText>
  ),
};

export const Body1Regular: Story = {
  name: 'Body1 regular',
  render: () => <CWText type="b1">Body1 regular</CWText>,
};

export const Body1Bold: Story = {
  name: 'Body1 bold',
  render: () => (
    <CWText type="b1" fontWeight="bold">
      Body1 bold
    </CWText>
  ),
};

export const Body1Italic: Story = {
  name: 'Body1 italic',
  render: () => (
    <CWText type="b1" fontWeight="italic">
      Body1 italic
    </CWText>
  ),
};

export const Body2Regular: Story = {
  name: 'Body2 regular',
  render: () => <CWText type="b2">Body2 regular</CWText>,
};

export const Body2Bold: Story = {
  name: 'Body2 bold',
  render: () => (
    <CWText type="b2" fontWeight="bold">
      Body2 bold
    </CWText>
  ),
};

export const Body2Italic: Story = {
  name: 'Body2 italic',
  render: () => (
    <CWText type="b2" fontWeight="italic">
      Body2 italic
    </CWText>
  ),
};

export const CaptionRegular: Story = {
  name: 'Caption regular',
  render: () => <CWText type="caption">Caption regular</CWText>,
};

export const CaptionMedium: Story = {
  name: 'Caption medium',
  render: () => (
    <CWText type="caption" fontWeight="medium">
      Caption medium
    </CWText>
  ),
};

export const CaptionUppercase: Story = {
  name: 'Caption uppercase',
  render: () => (
    <CWText type="caption" fontWeight="uppercase">
      Caption uppercase
    </CWText>
  ),
};

export const ButtonMini: Story = {
  name: 'Button mini',
  render: () => <CWText type="buttonMini">Button mini</CWText>,
};

export const ButtonSmall: Story = {
  name: 'Button small',
  render: () => <CWText type="buttonSm">Button small</CWText>,
};

export const ButtonLarge: Story = {
  name: 'Button large',
  render: () => <CWText type="buttonLg">Button large</CWText>,
};

export const Disabled: Story = {
  name: 'Disabled',
  render: () => <CWText type="h3">Disabled</CWText>,
};

export const Body1Disabled: Story = {
  name: 'Body1 disabled',
  render: () => (
    <div className="text-row">
      <CWText type="h3">Disabled</CWText>
      <CWText type="h3" disabled={true}>
        Body1 disabled
      </CWText>
    </div>
  ),
};

export const Body1NoWrap: Story = {
  name: 'Body1 noWrap',
  render: () => (
    <div className="text-row">
      <CWText type="h3">Overflow</CWText>
      <div className="ellipsis-row">
        <CWText type="h3" noWrap>
          Body1 noWrap
        </CWText>
      </div>
    </div>
  ),
};
