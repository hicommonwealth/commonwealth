import React from "react";
// import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "./CWInput";

const input = {
  title: "Example/CWInput",
  component: Input,
};
// } satisfies Meta<typeof Input>;

export default input;
// type Story = StoryObj<typeof Input>;

/** Large */
// export const Large: Story = {
export const Large = {
  render: () => (
    <Input
      name="Text field"
      label="Large"
      placeholder="Type here"
      size="large"
    />
  ),
};

/** Small */
// export const Small: Story = {
export const Small = {
  render: () => (
    <Input
      name="Text field"
      label="Small"
      placeholder="Type here"
      size="small"
    />
  ),
};

/** This input only accepts A-Z */
// export const OnlyLetters: Story = {
export const OnlyLetters = {
  render: () => (
    <Input
      name="Form field"
      label="This input only accepts A-Z"
      placeholder="Type here"
      size="large"
    />
  ),
};

/** Text field with icons */
// export const WithIcons: Story = {
export const WithIcons = {
  render: () => (
    <Input
      label="Text field with icons"
      name="Text field with icons"
      placeholder="Type here"
      iconRight="write"
      size="large"
    />
  ),
};

/** Disabled */
// export const Disabled: Story = {
export const Disabled = {
  render: () => (
    <Input
      name="Text field"
      placeholder="Some disabled text"
      label="Disabled"
      disabled
      value="Some disabled text"
      size="large"
    />
  ),
};

/** Dark mode */
// export const DarkMode: Story = {
export const DarkMode = {
  render: () => (
    <Input
      name="Text field dark mode"
      label="Dark mode"
      darkMode
      placeholder="Type here"
      size="large"
    />
  ),
};
