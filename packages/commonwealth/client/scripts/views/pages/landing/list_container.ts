
import { ClassComponent, ResultNode, render, setRoute, getRoute, getRouteParam, redraw, Component, jsx } from 'mithrilInterop';

const ListContainer: Component<
  {
    margin: string;
    bgColor: string;
  },
  {}
> = {
  view: (vnode) => {
    const INITIAL_LIST_STYLE = 'rounded-3xl p-3 lg:p-6 relative min-h-tabs lg:flex lg:flex-col lg:h-full';
    return render(
      'ul',
      {
        class: `${INITIAL_LIST_STYLE} ${vnode.attrs.bgColor} ${vnode.attrs.margin}`,
      },
      vnode.children
    );
  },
};

export default ListContainer;
