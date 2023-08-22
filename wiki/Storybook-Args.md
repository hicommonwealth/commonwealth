## Providing args

Args provide default values for controls we want to use.

For every arg key-value pair, the story controls will infer its type and give the respective input. Examples:
* [Button component](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/atoms/Button.stories.tsx) and the attribute `label: "Primary",` corresponding input will be text
* [Checkbox](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/molecules/Checkbox.stories.tsx) component and the attribute `checked: false,` corresponding input will be a toggle with options _true_ and _false_
* [VoteButton](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/molecules/VoteButton.stories.tsx) component and the attribute `voteCount: 0,` corresponding input will be number

Examples of the above:

![image](https://github.com/hicommonwealth/commonwealth/assets/30223098/377a3224-fed3-4e15-adaa-01d74a620ce6)

![image](https://github.com/hicommonwealth/commonwealth/assets/30223098/1f0fc4d6-417b-4b6d-9b1e-3a0f3f692417)

![image](https://github.com/hicommonwealth/commonwealth/assets/30223098/cae0417d-6097-4f34-be83-bb0f87fccc43)

## Changing input type

Values from one type can have an input of a different type. An example is the [Button story](https://github.com/hicommonwealth/commonwealth/blob/master/packages/commonwealth/.storybook/stories/atoms/Button.stories.tsx) args `buttonType: "primary-red",` with a radio button input with two or more options. Example:

![image](https://github.com/hicommonwealth/commonwealth/assets/30223098/2785ff04-61f1-4c45-9f4f-9afc9080e5fa)


---

Next page: [ArgTypes](https://github.com/hicommonwealth/commonwealth/wiki/ArgTypes)

---

## References:
1. https://storybook.js.org/docs/react/writing-stories/args