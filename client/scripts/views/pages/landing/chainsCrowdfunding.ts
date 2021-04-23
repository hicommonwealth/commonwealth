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
}

const ChainsCrowdfundingComponent: m.Component<IState, IState> = {
  oninit: (vnode) => {
    vnode.state.chains = vnode.attrs.chains;
  },
  view: (vnode) => {
    return m('section.ChainsCrowdfunding', { class: 'mx-auto pt-20 container ' }, [
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
          { class: 'btn-outline text-xl px-6 rounded-lg pb-3', href: '' },
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
          vnode.state.chains.map((chain: any) => {
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
                      // HOVER DYNAMIC WHEN BUTTON IS CLICKED (TODO)
                      class:
                        'rounded-2xl p-5 bg-gray-300 text-left w-full focus:outline-none',
                      onclick: "changeTokenCreatorsTab(1, 'secondSection')",
                      id: chain.button.id,
                    },
                    [
                      m(
                        'h4',
                        { class: 'font-bold text-xl' },
                        chain.button.title
                      ),
                      // SHOW TEXT WHEN ITS BUTTON ITS CLICKED (TODO)
                      m('p', { id: chain.button.card.id }, chain.button.card.text),
                    ]
                  )
                ),
                m(
                  'div',
                  {
                    class:
                      'flex justify-center lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0',
                    // SHOW CARD IMAGE WHEN ITS BUTTON ITS CLICKED (TODO)
                    id: chain.card.id,
                  },
                  m('img', {
                    class: 'block max-w-2xl w-full h-auto',
                    src: chain.card.src,
                    alt: chain.card.alt,
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

export default ChainsCrowdfundingComponent;
