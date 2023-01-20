
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

interface IAttrs {
  onchangeValue: (event: any) => void;
  onkeyupValue: (event: any) => void;
}

const FindYourTokenInputComponent: Component<IAttrs, {}> = {
  view: (vnode) => {
    return render('input', {
      autocomplete: 'off',
      class:
        'p-2 flex-grow mr-2 text-xl text-gray-400 pt-3.5 focus:outline-none',
      id: 'token-input',
      type: 'text',
      placeholder: 'Find your favorite token',
      oninput: vnode.attrs.onchangeValue,
      onkeyup: vnode.attrs.onkeyupValue,
    });
  },
};

export default FindYourTokenInputComponent;
