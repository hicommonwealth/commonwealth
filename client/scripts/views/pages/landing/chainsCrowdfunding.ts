import m from 'mithril';
import './chains_crowdfunding.scss';

interface IState {
  chains: {
    button: {
      id: string;
      title: string;
      card: { id: string; text: string };
    };
    card: { id: string; src: string; alt: string };
  }[];
  buttonHoverActiveById: string;
  chainCardImageActiveById: string;
}

interface IAttrs {
  chains: {
    button: {
      id: string;
      title: string;
      card: { id: string; text: string };
    };
    card: { id: string; src: string; alt: string };
  }[];
}

const removeOrAddClasslistFromChains = (chains, classlist, method) => {
  chains.forEach((chain: any) => {
    const METHODS = {
      add: () => document.getElementById(chain.card.id).classList.add(classlist),
      remove: () => document.getElementById(chain.card.id).classList.remove(classlist),
    };

    return METHODS[method]();
  });
};

const ChainsCrowdfundingComponent: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    vnode.state.chains = vnode.attrs.chains;
    vnode.state.buttonHoverActiveById = 'second-section-button1';
    vnode.state.chainCardImageActiveById = 'tab-card';
  },
  view: (vnode) => {
    return m(
      'section.ChainsCrowdfunding',
      { class: 'mx-auto pt-20 container ' },
      [
        m('img', {
          class: 'mx-auto mb-3 w-32 h-32',
          src: 'static/img/misc.png',
          alt: '',
        }),
        m(
          'h2',
          { class: 'text-3xl font-bold mb-5 text-center mb-10' },
          ' Leverage on-chain crowdfunding '
        ),
        m(
          'div.ChainsCrowdfundingButton',
          { class: 'flex justify-center text-center' },
          m(
            'a',
            {
              class: 'btn-outline text-xl rounded-lg pb-2 pt-3 px-3 ',
              href: '',
            },
            'Learn more about crowdfunding'
          )
        ),
        m(
          'ul',
          {
            class:
              'bg-white rounded-3xl p-3 lg:p-6 relative min-h-tabs lg:flex lg:flex-col lg:h-full mt-20',
          },
          [
            // tokensCreators and this are basically the same
            // @TODO Component it
            vnode.state.chains.map((chain: any) => {
              return m(
                'li',
                { class: 'lg:flex-grow' },
                m('div', { class: 'lg:flex lg:flex-row' }, [
                  m(
                    'div.ChainsCrowsfundingTextList',
                    { class: 'lg:w-1/3 lg:mr-5 xl:mr-20 rounded-2xl hover:transition-all duration-500' },
                    m(
                      'button',
                      {
                        class: `rounded-2xl p-5 text-left w-full focus:outline-none ${
                          vnode.state.buttonHoverActiveById === chain.button.id
                            ? 'bg-gray-300'
                            : ''
                        } transition transition-all duration-1000`,
                        onclick: () => {
                          removeOrAddClasslistFromChains(
                            vnode.state.chains,
                            'block',
                            'remove'
                          );
                          removeOrAddClasslistFromChains(
                            vnode.state.chains,
                            'hidden',
                            'remove'
                          );
                          removeOrAddClasslistFromChains(
                            vnode.state.chains.filter(
                              (chainToFilter) => chainToFilter !== chain
                            ),
                            'hidden',
                            'add'
                          );

                          document
                            .getElementById(chain.button.id)
                            .classList.add('bg-gray-300');
                          document
                            .getElementById(chain.card.id)
                            .classList.add('block');
                          vnode.state.buttonHoverActiveById = chain.button.id;
                          vnode.state.chainCardImageActiveById = chain.button.card.id;
                        },
                        id: chain.button.id,
                      },
                      [
                        m(
                          'h4',
                          { class: 'font-bold text-xl' },
                          chain.button.title
                        ),
                        m(
                          'p',
                          {
                            id: chain.button.card.id,
                            class: `${
                              vnode.state.buttonHoverActiveById === chain.button.id
                                ? ''
                                : 'hidden'
                            }`,
                          },
                          chain.button.card.text
                        ),
                      ]
                    )
                  ),
                  m(
                    'div',
                    {
                      class: `${
                        vnode.state.chainCardImageActiveById === chain.card.id
                          ? 'block'
                          : 'hidden'
                      } lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0`,
                      id: chain.card.id,
                    },
                    m('img.ChainsImage', {
                      class: '',
                      src: chain.card.src,
                      alt: chain.card.alt,
                    })
                  ),
                ])
              );
            }),
          ]
        ),
      ]
    );
  },
};

export default ChainsCrowdfundingComponent;
