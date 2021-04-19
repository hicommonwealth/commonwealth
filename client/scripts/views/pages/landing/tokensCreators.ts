import m from 'mithril';

const TokensCreatorComponent: m.Component<{}, {}> = {
  view: (vnode) => {
    return m('section', { class: 'container mx-auto pt-10' }, [
      m(
        'h2',
        { class: 'text-3xl font-extrabold mb-5 text-center' },
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
                      'rounded-2xl p-5 bg-gray-800 text-left w-full focus:outline-none',
                    id: 'button-tab-codepen1',
                    onclick: 'changeTokenCreatorsTab(1)',
                  },
                  [
                    m(
                      'h4',
                      { class: 'text-white font-extrabold text-xl' },
                      ' On-chain notifications '
                    ),
                    m(
                      'p',
                      { class: 'text-white', id: 'tab-codepen-text' },
                      ' Your token holders can stay up-to-date on chain events like votes and large transfers '
                    ),
                  ]
                )
              ),
              m(
                'div',
                {
                  class:
                    'flex justify-center lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0',
                  id: 'tab-codepen',
                },
                m('img', { src: 'assets/img/tab1.svg', alt: '' })
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
                    id: 'button-tab-codepen2',
                    onclick: 'changeTokenCreatorsTab(2)',
                  },
                  [
                    m(
                      'h4',
                      { class: 'text-white font-extrabold text-xl' },
                      ' Off-chain polling & On-chain voting '
                    ),
                    m(
                      'p',
                      { class: 'text-white ', id: 'tab2-codepen-text' },
                      ' Whether your community uses Snapshot, Comp Governance, or native layer 1. Access everything from one place. '
                    ),
                  ]
                )
              ),
              m(
                'div',
                {
                  class:
                    ' flex justify-center lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0',
                  id: 'tab2-codepen',
                },
                m('img', {
                  class: 'block max-w-none w-full h-auto',
                  src: 'assets/img/tab2.svg',
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
                    id: 'button-tab-codepen3',
                    onclick: 'changeTokenCreatorsTab(3)',
                  },
                  [
                    m(
                      'h4',
                      { class: 'text-white font-extrabold text-xl' },
                      ' Crowdfunding protocols '
                    ),
                    m(
                      'p',
                      { class: 'text-white ', id: 'tab3-codepen-text' },
                      ' Fund new tokens and community initiatives with Kickstarter-like raises from a thread '
                    ),
                  ]
                )
              ),
              m(
                'div',
                {
                  class:
                    ' flex justify-center lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0',
                  id: 'tab3-codepen',
                },
                m('img', {
                  class: 'block max-w-none w-full h-auto',
                  src: 'assets/img/tab3.svg',
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
                    id: 'button-tab-codepen4',
                    onclick: 'changeTokenCreatorsTab(4)',
                  },
                  [
                    m(
                      'h4',
                      { class: 'text-white font-extrabold text-xl' },
                      ' A rich forum experience '
                    ),
                    m(
                      'p',
                      { class: 'text-white ', id: 'tab4-codepen-text' },
                      ' Discuss memes and important topics alike in a Discourse-style forum. Enhance your posts with built in Markdown and fun reactions. '
                    ),
                  ]
                )
              ),
              m(
                'div',
                {
                  class:
                    ' flex justify-center lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0',
                  id: 'tab4-codepen',
                },
                m('img', {
                  class: 'block max-w-none w-full h-auto',
                  src: 'assets/img/tab4.svg',
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

export default TokensCreatorComponent;
