import m from 'mithril';
import './tokens_creators.scss';

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
  buttonHoverActiveById: string;
  textActiveById: string;
  chainCardImageActiveById: string;
}

interface IAttrs {
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

const removeOrAddClasslistFromChains = (creators, classlist, method) => {
  creators.forEach((creator: any) => {
    const METHODS = {
      add: () => document.getElementById(creator.card.id).classList.add(classlist),
      remove: () => document.getElementById(creator.card.id).classList.remove(classlist),
    };

    return METHODS[method]();
  });
};

const TokensCreatorComponent: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    vnode.state.creators = vnode.attrs.creators;
    vnode.state.buttonHoverActiveById = 'first-section-button1';
    vnode.state.textActiveById = 'tab-codepen-text';
    vnode.state.chainCardImageActiveById = 'tab-codepen';
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
        'div.TokensCreatorsButton',
        { class: 'text-center hidden lg:block xl:block mb-20' },
        m(
          'a',
          { class: 'btn-outline text-xl rounded-lg pb-2 pt-3 px-3 ', href: '' },
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
                      class: `${
                        vnode.state.buttonHoverActiveById === creator.button.id
                          ? 'bg-gray-500'
                          : ''
                      } rounded-2xl p-5 text-left w-full focus:outline-none`,
                      id: creator.button.id,
                      onclick: () => {
                        removeOrAddClasslistFromChains(
                          vnode.state.creators,
                          'block',
                          'remove'
                        );
                        removeOrAddClasslistFromChains(
                          vnode.state.creators,
                          'hidden',
                          'remove'
                        );

                        const filteredCreators = vnode.state.creators.filter(
                          (creatoarToFilter) => creatoarToFilter !== creator
                        );

                        removeOrAddClasslistFromChains(
                          filteredCreators,
                          'hidden',
                          'add'
                        );

                        document
                          .getElementById(creator.button.id)
                          .classList.add('bg-gray-500');
                        document
                          .getElementById(creator.card.id)
                          .classList.add('block');
                        document
                          .getElementById(creator.texts.id)
                          .classList.add('block');
                        vnode.state.buttonHoverActiveById = creator.button.id;
                        vnode.state.chainCardImageActiveById = creator.card.id;
                        vnode.state.textActiveById = creator.texts.id;
                      },
                    },
                    [
                      m(
                        'h4',
                        { class: 'text-white font-bold text-xl' },
                        creator.texts.title
                      ),
                      m(
                        'p',
                        {
                          class: `${
                            vnode.state.buttonHoverActiveById === creator.button.id
                              ? 'bg-gray-500'
                              : 'hidden'
                          } text-white`,
                          id: creator.texts.id,
                        },
                        creator.texts.text
                      ),
                    ]
                  )
                ),
                m(
                  'div',
                  {
                    class: `${
                      vnode.state.chainCardImageActiveById === creator.card.id
                        ? 'block'
                        : 'hidden'
                    } flex justify-center lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0`,
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
