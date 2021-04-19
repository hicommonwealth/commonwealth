import m from 'mithril';

const ChainsCrowdfundingComponent: m.Component<{}, {}> = {
  view: (vnode) => {
    return m('section', { class: 'container mx-auto pt-20' }, [
      m('img', {
        class: 'mx-auto mb-3 w-36 h-auto',
        src: 'assets/img/misc.png',
        alt: '',
      }),
      m(
        'h2',
        { class: 'text-3xl font-extrabold mb-5 text-center mb-10' },
        ' Leverage on-chain crowdfunding '
      ),
      m(
        'div',
        { class: 'text-center' },
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
          m(
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
                      'rounded-2xl p-5 bg-gray-100 text-left w-full focus:outline-none',
                    onclick: 'changeCrowdfundingTab(1)',
                    id: 'tab-card-button',
                  },
                  [
                    m(
                      'h4',
                      { class: 'font-extrabold text-xl' },
                      'Fund new projects'
                    ),
                    m(
                      'p',
                      { id: 'tab-card-text' },
                      ' Anyone from within your community can easily turn a conversation thread into a Kickstarter-like campaign '
                    ),
                  ]
                )
              ),
              m(
                'div',
                {
                  class:
                    'flex justify-center lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0',
                  id: 'tab-card',
                },
                m('img', {
                  class: 'block max-w-2xl w-full h-auto',
                  src: 'assets/img/card1.png',
                  alt: '',
                })
              ),
            ])
          ),
          m(
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
                      'rounded-2xl p-5 text-left w-full focus:outline-none',
                    onclick: 'changeCrowdfundingTab(2)',
                    id: 'tab2-card-button',
                  },
                  [
                    m(
                      'h4',
                      { class: 'font-extrabold text-xl' },
                      ' Create Community Endowments '
                    ),
                    m(
                      'p',
                      { id: 'tab2-card-text' },
                      ' Lets you pool funds with other like minded folks and fund interesting projects within your community or across the web[need better word] '
                    ),
                  ]
                )
              ),
              m(
                'div',
                {
                  class:
                    ' flex justify-center lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0',
                  id: 'tab2-card',
                },
                m('img', {
                  class: 'block max-w-2xl w-full h-auto',
                  src: 'assets/img/card2.png',
                  alt: '',
                })
              ),
            ])
          ),
          m(
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
                      'rounded-2xl p-5 text-left w-full focus:outline-none',
                    onclick: 'changeCrowdfundingTab(3)',
                    id: 'tab3-card-button',
                  },
                  [
                    m(
                      'h4',
                      { class: 'font-extrabold text-xl' },
                      'Launch New Tokens'
                    ),
                    m(
                      'p',
                      { id: 'tab3-card-text' },
                      ' Use a project to raise funds for a new tokenize DeFi or NFT token and optionally plug in an allowlist for KYC compliance '
                    ),
                  ]
                )
              ),
              m(
                'div',
                {
                  class:
                    'flex justify-center lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0',
                  id: 'tab3-card',
                },
                m('img', {
                  class: 'block max-w-2xl w-full h-auto',
                  src: 'assets/img/card3.png',
                  alt: '',
                })
              ),
            ])
          ),
        ]
      ),
    ]);
  },
};

export default ChainsCrowdfundingComponent;
