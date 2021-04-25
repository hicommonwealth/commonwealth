import m from 'mithril';

interface IAttrs {
  onchangeValue: (event: any) => void
}

const FindYourTokenInputComponent: m.Component<IAttrs, {}> = {
  view: (vnode) => {
    return m('input', {
      autocomplete: 'off',
      class:
        'p-2 flex-grow mr-2 text-xl text-gray-400 pt-3.5 focus:outline-none',
      id: 'token-input',
      type: 'text',
      placeholder: 'Find your favorite token',
      onchange: vnode.attrs.onchangeValue,
      oninput: vnode.attrs.onchangeValue
    });
  },
};

export default FindYourTokenInputComponent;
