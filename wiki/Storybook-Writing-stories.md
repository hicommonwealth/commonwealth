## Table of contents

1. [Basics](#basics)
2. [Args and argTypes](#args-and-argTypes)
3. [Two or more stories for the same component](#two-or-more-stories-for-the-same-component)
4. [Controls](#controls)
5. [Custom component function](custom-component-function)
6. [References](#references)

## Basics

When writing stories to a component we essentially need to
* Import components we want to show
* Define the Component Story Format
* Write one or more stories

Below is a simple [story for the Spinner component](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/molecules/Spinner.stories.tsx) that has all 3:

```typescript
import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWSpinner } from '../../../client/scripts/views/components/component_kit/cw_spinner';

const spinner = {
  title: 'Molecules/Spinner',
  component: CWSpinner,
} satisfies Meta<typeof CWSpinner>;

export default spinner;
type Story = StoryObj<typeof spinner>;

export const Spinner: Story = { render: () => <CWSpinner /> }
```

## Args and argTypes

Additionally we can set the default [args](https://github.com/hicommonwealth/commonwealth/wiki/Args) for a story control and [more information](https://github.com/hicommonwealth/commonwealth/wiki/ArgTypes) about them:

```typescript
import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWSpinner } from '../../../client/scripts/views/components/component_kit/cw_spinner';

const spinner = {
  title: 'Molecules/Spinner',
  component: CWSpinner,
} satisfies Meta<typeof CWSpinner>;

export default spinner;
type Story = StoryObj<typeof spinner>;

export const Spinner: Story = {
  args: {
    size: "xl",
  },
  argTypes: {
    size: {
      control: { type: "radio" },
      options: ["xxs", "xs", "small", "medium", "large", "xl", "xxl"],
    },
  },
  render: ({...args}) => <CWSpinner {...args} />
};

```

## Two or more stories for the same component

Some components have variations that can be displayed in different stories.

The [stories for the Button component](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/atoms/Button.stories.tsx) were separated by button type (e.g. primary, secondary, tertiary, etc.)

## Controls

[Storybook control](https://github.com/hicommonwealth/commonwealth/wiki/Controls) allows us to interact with the components and change their appearance. [This example](https://github.com/hicommonwealth/commonwealth/wiki/Storybook-Introduction#page-example) shows the interaction with controls for the Tag component.

## Custom component function

Sometimes we need to write a [custom function](https://github.com/hicommonwealth/commonwealth/wiki/Custom-components) that will render the component we want to display on the story. This custom function may handle state change or work with args passed by user on controls.

[Stories for the Checkbox component](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/molecules/Checkbox.stories.tsx) show an example of state change handling with a custom funtion.

The [story below about VoteButton component](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/molecules/VoteButton.stories.tsx) is an example of both state change handling and args passed by the user:

```typescript
import React, { FC, useEffect, useState } from 'react';
import type { Meta } from '@storybook/react';

import { CWThreadVoteButton } from '../../../client/scripts/views/components/component_kit/cw_thread_vote_button';

const voteButton = {
  title: 'Molecules/Vote Button',
  component: CWThreadVoteButton,
} satisfies Meta<typeof CWThreadVoteButton>;

export default voteButton;

interface VoteButtonProps {
  count: number;
};

const VoteButton: FC<VoteButtonProps> = ({ count }) => {
  const [voteCount, setVoteCount] = useState<number>(count);

  useEffect(() => setVoteCount(count), [count]);

  return (
    <CWThreadVoteButton
      updateVoteCount={(newCount: number) => {
        setVoteCount(newCount);
      }}
      voteCount={voteCount}
    />
  )
};

export const VoteButtonStory = {
  name: "Vote Button",
  args: {
    voteCount: 0,
  },
  argTypes: {
    voteCount: {
      control: { type: "number" },
    },
  },
  parameters: {
    controls: {
      exclude: [ "updateVoteCount" ],
    },
  },
  render: ({...args}) => <VoteButton count={args.voteCount} />
};

```

## References:
1. https://storybook.js.org/docs/react/writing-stories/introduction

---

Next page: [Args](https://github.com/hicommonwealth/commonwealth/wiki/Args)