Component Story Format (CSF) is the recommended way to [write stories](https://storybook.js.org/docs/react/writing-stories/introduction). It's an [open standard](https://github.com/ComponentDriven/csf) based on ES6 modules that is portable beyond Storybook.

## Default export

The default export defines metadata about your component, including the component itself, its title and more.

The most used properties are _component_ and _title_. The _component_ field is required and used by addons for automatic prop table generation and display of other component metadata. The _title_ field is optional and should be unique (i.e., not re-used across files).

## Example

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

export const Spinner: Story = ({...args}) => <CWSpinner {...args} />;
```

On the story above the component is shown inside the "Molecules" folder as follows:

![image](https://github.com/hicommonwealth/commonwealth/assets/30223098/c69ab6a9-23de-42da-8585-afa042e8c7cb)

## Named story exports

With CSF, every named export in the file represents a story object by default.

The example below is taken from the Button stories written in [this file](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/atoms/Button.stories.tsx).

```typescript
import React from 'react';
import type { Meta, StoryObj } from "@storybook/react";

import { CWButton } from '../../../client/scripts/views/components/component_kit/cw_button';

const button = {
  title: 'Atoms/Button',
  component: CWButton,
} satisfies Meta<typeof CWButton>;

export default button;
type Story = StoryObj<typeof CWButton>;

export const Primary: Story = { ... };

export const Secondary: Story = { ... };

export const Tertiary: Story = { ... };
```

The stories result of the named exports:

![image](https://github.com/hicommonwealth/commonwealth/assets/30223098/d6d52fb6-3490-4909-a1fe-c18b9a0ec05e)

## References

1. [Component Story Format](https://storybook.js.org/docs/react/api/csf)

---

Next page: [Writing stories](https://github.com/hicommonwealth/commonwealth/wiki/Writing-stories)

