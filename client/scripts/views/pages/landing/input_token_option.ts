import m from 'mithril';

const ADD_TOKEN_LINK = 'https://hicommonwealth.typeform.com/to/cRP27Rp5';

interface IAttrs {
  iconImg: string;
  text: string;
  route: string;
}

const InputTokenOptionComponent: m.Component<IAttrs, {}> = {
  view: (vnode) => {
    const { iconImg } = vnode.attrs;
    let tokenImage;
    if (!iconImg || !iconImg.length || iconImg.slice(0, 4) === 'ipfs') {
      tokenImage = m('.TokenIcon', [
        m('.token-icon.no-image', {
          style: 'width: 1.5rem; height: 1.5rem;',
          onclick
        }, [
          m('span', {
            style: 'font-size: 1.25rem;'
          }, vnode.attrs.text.slice(0, 1))
        ])
      ]);
    } else {
      tokenImage = m('img', {
        class: 'mr-4 h-6 w-6',
        src: iconImg,
        alt: '',
      });
    }
    return m(
      'li',
      m(
        'button',
        {
          onclick: (e) => {
            if (vnode.attrs.route === 'placeholder') {
              e.preventDefault();
              window.location.href = ADD_TOKEN_LINK;
            } else {
              e.preventDefault();
              localStorage['home-scrollY'] = window.scrollY;
              m.route.set(`/${vnode.attrs.route}`);
            }
          },
          class:
            'p-3 rounded hover:bg-gray-100 flex flex-grow items-center flex-row text-left leading-none w-full justify-between focus:outline-none',
        },
        m('span', { class: 'flex flex-row font-bold' }, [
          tokenImage,
          m('span', { class: 'mt-1' }, vnode.attrs.text),
        ])
      )
    );
  },
};

export default InputTokenOptionComponent;
