import m from 'mithril';

interface IAttrs {
  onClick?: () => {};
  href: any;
  text: string;
}

const LandingPageButton: m.Component<IAttrs, {}> = {
  view: (vnode) => {
    return m(
      'a',
      {
        class: 'btn-outline text-xl rounded-lg pb-2 pt-3 px-3 ',
        href: vnode.attrs.href,
        onClick: vnode.attrs.onClick,
      },
      vnode.attrs.text
    );
  },
};

export default LandingPageButton;
