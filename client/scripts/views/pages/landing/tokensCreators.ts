import m from 'mithril';

interface IState {
  creators: {
    button: {
      id: string;
    };
    texts: {
      id: string;
      title: string;
      text: string;
    };
    card: {
      id: string;
      imgSrc: string;
      imgAlt: string;
    };
  }[];
}

const TokensCreatorComponent: m.Component<IState, IState> = {
  oninit: (vnode) => {
    vnode.state.creators = vnode.attrs.creators;
  },
  view: (vnode) => {
    return m('section', { class: 'container mx-auto pt-10' }, [
      m(
        'h2',
        { class: 'text-3xl font-bold mb-5 text-center' },
        ' Token creators are empowered '
      ),
      m(
        'p',
        { class: 'text-2xl max-w-screen-sm mx-auto text-center mb-10' },
        ' Commonwealth lets you simplify your community and governance. We bring four tools into one. '
      ),
      m(
        'div',
        { class: 'text-center hidden lg:block xl:block mb-20' },
        m(
          'a',
          { class: 'btn-outline text-xl px-6 rounded-lg pb-3', href: '' },
          'See use cases'
        )
      ),
      m(
        'ul',
        {
          class:
            'bg-gray-900 rounded-3xl p-3 lg:p-6 relative min-h-tabs lg:flex lg:flex-col lg:h-full',
        },
        [
          vnode.state.creators.map((creator: any) => {
            return m(
              'li',
              { class: 'lg:flex-grow' },
              m('div', { class: 'lg:flex lg:flex-row' }, [
                m(
                  'div',
                  { class: 'lg:w-1/3 lg:mr-5 xl:mr-20' },
                  m(
                    'button',
                    {
                      class:
                        'rounded-2xl p-5 bg-gray-500 text-left w-full focus:outline-none',
                      id: creator.button.id,
                      onclick: "changeTokenCreatorsTab(1, 'firstSection')",
                    },
                    [
                      m(
                        'h4',
                        { class: 'text-white font-bold text-xl' },
                        creator.texts.title
                      ),
                      m(
                        'p',
                        { class: 'text-white', id: creator.texts.id },
                        creator.texts.text
                      ),
                    ]
                  )
                ),
                m(
                  'div',
                  {
                    class:
                      'flex justify-center lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0',
                    id: creator.card.id,
                  },
                  m('img', {
                    src: creator.card.imgSrc,
                    alt: creator.card.imgAlt,
                  })
                ),
              ])
            );
          }),
        ]
      ),
    ]);
  },
};

export default TokensCreatorComponent;
