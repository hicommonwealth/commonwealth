import m from 'mithril';
import ClassComponent from 'class_component';

type IAttrs = {
  onclick?: () => {};
  href: any;
  text: string;
}

class LandingPageButton extends ClassComponent<IAttrs, {}> {
  public view(vnode) {
    return m(
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
