import m from 'mithril';

const TokensChainsComponent: m.Component<{}, {}> = {
  view: (vnode) => {
    return m(
      'section',
      {
        class:
          'bg-geometric-pattern bg-cover bg-full pt-20 pb-40 md:pb-48 mb-40 relative',
      },
      [
        m('div', { class: 'container mx-auto' }, [
          m(
            'h2',
            {
              class: 'text-3xl text-left font-extrabold mb-5 md:text-center',
            },
            ' Every Token. Every Chain. '
          ),
          m(
            'p',
            {
              class:
                'text-left max-w-screen-md mx-auto text-2xl md:text-center',
            },
            ' With Commonwealth, any token holder can drive their community. Subscribe to chain activity like whale transfers or new votes, discuss new ideas, crowdfund community projects, and access native governance for Layer 1s and NFTs alike. '
          ),
        ]),
        m(
          'div',
          {
            class: 'absolute bottom-0 left-0 right-0 transform translate-y-1/2',
          },
          m(
            'div',
            { class: 'glide' },
            m(
              'div',
              { class: 'glide__track', 'data-glide-el': 'track' },
              m('ul', { class: 'glide__slides' }, [
                m(
                  'li',
                  { class: 'glide__slide  h-48' },
                  m(
                    'div',
                    {
                      class:
                        'bg-white rounded shadow-xl p-5 xl:p-10 text-center',
                    },
                    [
                      m('img', {
                        class: 'mx-auto mb-3 w-12 h-auto',
                        src: 'assets/img/near-protocol.png',
                        alt: '',
                      }),
                      m(
                        'h3',
                        { class: 'text-2xl font-extrabold mb-1' },
                        'NEAR Protocol'
                      ),
                      m(
                        'p',
                        { class: 'text-xl' },
                        ' High-performance platform for dapps with foccus on UX '
                      ),
                    ]
                  )
                ),
                m(
                  'li',
                  { class: 'glide__slide  h-48' },
                  m(
                    'div',
                    {
                      class:
                        'bg-white rounded shadow-xl p-5 xl:p-10 text-center',
                    },
                    [
                      m('img', {
                        class: 'mx-auto mb-3 w-12 h-auto',
                        src: 'assets/img/edgeware.svg',
                        alt: '',
                      }),
                      m(
                        'h3',
                        { class: 'text-2xl font-extrabold mb-1' },
                        'Edgeware'
                      ),
                      m(
                        'p',
                        { class: 'text-xl' },
                        ' Next generation smart contracts '
                      ),
                    ]
                  )
                ),
                m(
                  'li',
                  { class: 'glide__slide  h-48' },
                  m(
                    'div',
                    {
                      class:
                        'bg-white rounded shadow-xl p-5 xl:p-10 text-center',
                    },
                    [
                      m('img', {
                        class: 'mx-auto mb-3 w-12 h-auto',
                        src: 'assets/img/straightedge.svg',
                        alt: '',
                      }),
                      m(
                        'h3',
                        { class: 'text-2xl font-extrabold mb-1' },
                        'Straightedge'
                      ),
                      m(
                        'p',
                        { class: 'text-xl' },
                        ' A Cosmic smart contracting platform '
                      ),
                    ]
                  )
                ),
                m(
                  'li',
                  { class: 'glide__slide  h-48' },
                  m(
                    'div',
                    {
                      class:
                        'bg-white rounded shadow-xl p-5 xl:p-10 text-center',
                    },
                    [
                      m('img', {
                        class: 'mx-auto mb-3 w-12 h-auto',
                        src: 'assets/img/near-protocol.png',
                        alt: '',
                      }),
                      m(
                        'h3',
                        { class: 'text-2xl font-extrabold mb-1' },
                        'NEAR Protocol'
                      ),
                      m(
                        'p',
                        { class: 'text-xl' },
                        ' High-performance platform for dapps with focus on UX '
                      ),
                    ]
                  )
                ),
              ])
            )
          )
        ),
      ]
    );
  },
};

export default TokensChainsComponent;
