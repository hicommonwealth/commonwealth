import m from 'mithril';
import ClassComponent from 'class_component';

class ListContainer extends ClassComponent<
  {
    margin: string;
    bgColor: string;
  },
  {}
> {
  public view(vnode) {
    const INITIAL_LIST_STYLE = 'rounded-3xl p-3 lg:p-6 relative min-h-tabs lg:flex lg:flex-col lg:h-full';
    return m(
      'ul',
      {
        class: `${INITIAL_LIST_STYLE} ${vnode.attrs.bgColor} ${vnode.attrs.margin}`,
      },
      vnode.children
    );
  },
};

export default ListContainer;
