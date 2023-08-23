## Table of contents

1. [Definition](#definition)
2. [Example](#example)
3. [Stories file extension and where to add them](#stories-file-extension-and-where-to-add-them)
4. [References](#references)

## Definition

As defined on [this page](https://storybook.js.org/docs/react/writing-stories/introduction), a story "captures the rendered state of a UI component. It’s a function that returns a component’s state given a set of arguments."

Every storybook story displays one or more components and what we can do with it.

## Example

[Story file](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/molecules/Collapsible.stories.tsx) for the Collapsible component and the resulting story

```typescript
import React from 'react';
import type { Meta } from '@storybook/react';

import { CWCollapsible } from '../../../client/scripts/views/components/component_kit/cw_collapsible';
import { CWText } from '../../../client/scripts/views/components/component_kit/cw_text';

const collapsible = {
  title: 'Molecules/Collapsible',
  component: CWCollapsible,
} satisfies Meta<typeof CWCollapsible>;

export default collapsible;

export const Collapsible = {
  args: {
    headerContent: "Header content",
    collapsibleContent: "Body content",
  },
  argTypes: {
    headerContent: {
      control: { type: "text" }
    },
    collapsibleContent: {
      control: { type: "text" }
    },
  },
  render: ({...args}) => (
    <CWCollapsible
      headerContent={<CWText>{args.headerContent}</CWText>}
      collapsibleContent={<CWText>{args.collapsibleContent}</CWText>}
    />
  )
}

```

![image](https://github.com/hicommonwealth/commonwealth/assets/30223098/92fd0328-13d3-4f66-8f1e-f7bdd5ec7368)

## Stories file extension and where to add them

The image below shows an example of stories inside folders following the [atomic design methodology](https://atomicdesign.bradfrost.com/chapter-2/#the-atomic-design-methodology)

![image](https://github.com/hicommonwealth/commonwealth/assets/30223098/5673a1de-243e-4e3f-8b5d-46fa794de145)

The location of all stories can be defined on Storybook main config file, as follows:

![image](https://github.com/hicommonwealth/commonwealth/assets/30223098/4cf33e27-1440-4046-9d3e-312d4fcc2346)

## References
1. [How to write stories](https://storybook.js.org/docs/react/writing-stories/introduction)

---

Next page: [Component Story Format (CSF)](https://github.com/hicommonwealth/commonwealth/wiki/Component-Story-Format)

Back to the top: [^](#table-of-contents)