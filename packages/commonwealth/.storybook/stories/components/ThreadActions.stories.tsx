import React, { FC, useEffect, useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWThreadAction } from "../../../client/scripts/views/components/component_kit/new_designs/cw_thread_action";

const threadActions = {
  title: "Components/Thread Actions/Actions",
  component: CWThreadAction,
} satisfies Meta<typeof CWThreadAction>;

export default threadActions;
type Story = StoryObj<typeof threadActions>;

export const Comment: Story = {
  args: {
    disabled: false,
  },
  parameters: {
    controls: {
      exclude: [
        "label",
        "count",
        "onChange",
      ],
    },
  },
  render: ({...args}) => (
    <CWThreadAction
      label="comment"
      onChange={() => console.log('Comment action clicked!')}
      disabled={args.disabled}
    />
  ),
};

export const Share: Story = {
  args: {
    disabled: false,
  },
  parameters: {
    controls: {
      exclude: [
        "label",
        "count",
        "onChange",
      ],
    },
  },
  render: ({...args}) => (
    <CWThreadAction
      label="share"
      onChange={() => console.log('Share action clicked!')}
      disabled={args.disabled}
    />
  ),
};

export const Subscribe: Story = {
  args: {
    disabled: false,
  },
  parameters: {
    controls: {
      exclude: [
        "label",
        "count",
        "onChange",
      ],
    },
  },
  render: ({...args}) => (
    <CWThreadAction
      label="subscribe"
      onChange={() => console.log('Subscribe action clicked!')}
      disabled={args.disabled}
    />
  ),
};

export const Upvote: Story = {
  args: {
    disabled: false,
  },
  parameters: {
    controls: {
      exclude: [
        "label",
        "count",
        "onChange",
      ],
    },
  },
  render: ({...args}) => (
    <CWThreadAction
      label="upvote"
      onChange={() => console.log('Upvote action clicked!')}
      disabled={args.disabled}
    />
  ),
};

export const Overflow: Story = {
  args: {
    disabled: false,
  },
  parameters: {
    controls: {
      exclude: [
        "label",
        "count",
        "onChange",
      ],
    },
  },
  render: ({...args}) => (
    <CWThreadAction
      label="overflow"
      onChange={() => console.log('Overflow action clicked!')}
      disabled={args.disabled}
    />
  ),
};
