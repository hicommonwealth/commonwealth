As quoted in [Storybook-Writing-Stories.md](Storybook-Writing-Stories.md), we can define custom functional components to handle state change with args passed as parameter. The [Checkbox story](../../packages/commonwealth/.storybook/stories/old/molecules/Checkbox.stories.tsx) is a good example, as follows:

```typescript
const Checkbox: FC<CheckboxProps> = (props) => {
  const { checked, disabled, label, indeterminate } = props;
  const [isChecked, setIsChecked] = useState<boolean | undefined>(checked);
  const [isDisabled, setIsDisabled] = useState<boolean | undefined>(disabled);
  const [isIndeterminate, setIsIndeterminate] = useState<boolean | undefined>(indeterminate);

  useEffect(() => setIsChecked(checked), [checked]);
  useEffect(() => setIsDisabled(disabled), [disabled]);
  useEffect(() => setIsIndeterminate(indeterminate), [indeterminate]);

  return (
    <CWCheckbox
      checked={isChecked}
      disabled={isDisabled}
      indeterminate={isIndeterminate}
      label={label}
      onChange={(e) => {
        setIsChecked(!isChecked);
        e.stopPropagation();
      }}
    />
  );
}

export const CheckboxStory = {
  // ...
  args: {
    label: "Click me",
    disabled: false,
    checked: false,
    indeterminate: false,
  },
  argTypes: {
    label: {
      control: { type: "text" },
    },
    disabled: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
    checked: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
    indeterminate: {
      control: { type: "boolean" },
      options: [ true, false ],
    },
  },
  // ...
  render: ({...args}) => (
    <Checkbox
      label={args.label}
      disabled={args.disabled}
      checked={args.checked}
      indeterminate={args.indeterminate}
    />
  ),
}
```

# Change Log

- 230113: Flagged by Graham Johnson for consolidation or relocation.
- 230530: Authored by Daniel Martins.