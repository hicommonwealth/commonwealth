import m from 'mithril';

interface IAttrs {
  handleClick: (creator) => void;
  isTabHoverActive: boolean;
  buttonId: string;
  tabHoverColorClick: string;
  title: string;
  subtitle: string;
  subtitleId?: string;
  imageActive: boolean;
  cardId: string;
  imageSrc: string;
  imageAlt: string;
  textType?: string;
  variant?: string;
}

const ListedCardWithImage: m.Component<IAttrs, {}> = {
  view: (vnode) => {
    return m(
      'li',
      { class: 'lg:flex-grow' },
      m('div', { class: 'lg:flex lg:flex-row' }, [
        m(
          'div',
          {
            class:
              'lg:w-1/3 lg:mr-5 xl:mr-20 p-1 rounded-2xl transition hover:transition-all duration-500',
          },
          m(
            'button',
            {
              class: `rounded-2xl p-5 text-left w-full focus:outline-none transition transition-all duration-500 ${
                vnode.attrs.isTabHoverActive
                  ? `${vnode.attrs.tabHoverColorClick}`
                  : ''
              }  ${vnode.attrs.variant}`,
              onclick: vnode.attrs.handleClick,
              id: vnode.attrs.buttonId,
            },
            [
              m(
                'h4',
                {
                  class: `${
                    vnode.attrs.textType === 'black' ? '' : 'text-white'
                  } font-bold text-xl`,
                },
                vnode.attrs.title
              ),
              m(
                'p',
                {
                  id: vnode.attrs.subtitleId,
                  class: `${vnode.attrs.isTabHoverActive ? '' : 'invisible'} ${
                    vnode.attrs.textType === 'black' ? '' : 'text-white'
                  }`,
                },
                vnode.attrs.subtitle
              ),
            ]
          )
        ),
        m(
          'div',
          {
            class: `${
              vnode.attrs.imageActive ? 'block' : 'invisible'
            }  lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0`,
            id: vnode.attrs.cardId,
          },
          m('img.TokensCreatorsImage', {
            class: `${
              vnode.attrs.imageActive ? 'block' : 'hidden'
            } block max-w-2xl w-full h-auto`,
            src: vnode.attrs.imageSrc,
            alt: vnode.attrs.imageAlt,
          })
        ),
      ])
    );
  },
};

export default ListedCardWithImage;
