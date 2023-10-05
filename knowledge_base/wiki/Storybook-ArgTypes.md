## Definitions

With the argTypes we can define explicitly the type of every argument, change its input type and set all possible options.

Example for the [Text component](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/atoms/Text.stories.tsx):

```typescript
export const Text: Story = {
  // ...
  args: {
    children: "Display1 semi bold",
    fontWeight: "semiBold",
    fontStyle: undefined,
    type: "d1",
    disabled: false,
    isCentered: false,
    noWrap: false,
  },
  argTypes: {
    disabled: {
      options: [ true, false ],
    },
    fontStyle: {
      control: { type: "inline-radio" },
      options: [ undefined, 'italic', 'uppercase' ],
    },
    fontWeight: {
      control: { type: "inline-radio" },
      options: [ "regular", "medium", "semiBold", "bold", "black", "italic", "uppercase" ],
    },
    isCentered: {
      options: [ true, false ],
    },
    noWrap: {
      options: [ true, false ],
    },
    type: {
      control: { type: "inline-radio" },
      options: [ "d1", "d2", "h1", "h2", "h3", "h4", "h5", "b1", "b2", "caption", "buttonSm", "buttonLg", "buttonMini" ],
    },
  },
  // ...
};
```

https://github.com/hicommonwealth/commonwealth/assets/30223098/b8afc832-7cb3-442a-8e90-1054b07c0332

## Custom functions

We can also define custom functions for different stories for the same component. All stories could have common argTypes but different options.

Below is a custom function example for the [Button component](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/atoms/Button.stories.tsx):

```typescript
const argTypesObj = (options: string[]) => {
  return {
    iconLeft: {
      control: { type: "select" },
      options: iconOptions,
    },
    iconRight: {
      control: { type: "select" },
      options: iconOptions,
    },
    label: {
      control: { type: "text" },
    },
    buttonType: {
      control: { type: "radio" },
      options: [ ...options ],
    },
    disabled: {
      options: [ true, false ],
    },
  }
}

export const Primary: Story = {
  args: {
    label: "Primary",
    iconLeft: "person",
    iconRight: undefined,
    buttonType: "primary-red",
    disabled: false,
  },
  argTypes: argTypesObj([ "primary-red", "primary-blue", "primary-blue-dark", "primary-black" ]),
  ...commonParameters,
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!')} />
  ),
};

export const Secondary: Story = {
  args: {
    label: "Secondary",
    iconLeft: "person",
    buttonType: "secondary-red",
    disabled: false,
  },
  argTypes: argTypesObj([ "secondary-red", "secondary-blue", "secondary-blue-dark", "secondary-black" ]),
  ...commonParameters,
  render: ({...args}) => (
    <CWButton {...args} onClick={() => notifySuccess('Button clicked!') } />
  ),
};
```

## References

1. https://storybook.js.org/docs/react/api/argtypes

---

Next page: [Parameters](https://github.com/hicommonwealth/commonwealth/wiki/Parameters)