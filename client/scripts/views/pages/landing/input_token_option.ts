import m from 'mithril';

const ADD_TOKEN_LINK = 'https://hicommonwealth.typeform.com/to/cRP27Rp5';

interface IAttrs {
  iconImg: string;
  text: string;
  id: string;
}

const InputTokenOptionComponent: m.Component<IAttrs, {}> = {
  view: (vnode) => {
    return m(
      'li',
      m(
        'button',
        {
          onclick: (e) => {
            if (vnode.attrs.id === 'placeholder') {
              e.preventDefault();
              window.location.href = ADD_TOKEN_LINK;
            } else {
              e.preventDefault();
              localStorage['home-scrollY'] = window.scrollY;
              m.route.set(`/${vnode.attrs.id}`);
            }
          },
          class:
            'p-3 rounded hover:bg-gray-100 flex flex-grow items-center flex-row text-left leading-none w-full justify-between focus:outline-none',
        },
        m('span', { class: 'flex flex-row font-bold' }, [
          m('img', {
            class: 'mr-4 h-6 w-6',
            src: vnode.attrs.iconImg,
            alt: '',
          }),
          m('span', { class: 'mt-1' }, vnode.attrs.text),
        ])
      )
    );
  },
};

export default InputTokenOptionComponent;
