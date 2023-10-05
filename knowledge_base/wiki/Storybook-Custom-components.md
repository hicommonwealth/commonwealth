As quoted in [this page](https://github.com/hicommonwealth/commonwealth/wiki/Writing-stories#custom-component-function), we can define custom functional components to handle state change with args passed as parameter. The [Checkbox story](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/molecules/Checkbox.stories.tsx) is a good example, as follows:

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

---

Next page: [Controls](https://github.com/hicommonwealth/commonwealth/wiki/Controls)