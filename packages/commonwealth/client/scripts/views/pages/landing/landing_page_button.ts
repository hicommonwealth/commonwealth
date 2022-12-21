
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

interface IAttrs {
  onclick?: () => {};
  href: any;
  text: string;
}

const LandingPageButton: Component<IAttrs, {}> = {
  view: (vnode) => {
    return render(
      'a',
      {
        class: 'btn-outline text-xl rounded-lg pb-2 pt-3 px-3 ',
        href: vnode.attrs.href,
        onclick: vnode.attrs.onclick,
        style: 'padding: 8px 16px',
      },
      vnode.attrs.text
    );
  },
};

export default LandingPageButton;
