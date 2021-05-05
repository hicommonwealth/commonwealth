import m from 'mithril';
import HeaderLandingPage from '../landing/landing_page_header';
import FooterLandingPage from '../landing/landing_page_footer';

const WhyCommonWealthView: m.Component<{}, {}> = {
  view: (vnode) => {
    return m('div', [
      m(
        'div',
        { class: 'absolute w-screen z-20' },
        m(HeaderLandingPage, {
          navs: [
            { text: 'Why Commonwealth?', redirectTo: '/whyCommonWealth' },
            // { text: 'Use Cases' },
            // { text: 'Crowdfunding' },
            // { text: 'Developers' },
          ],
        })
      ),
      m(
        'section',
        {
          class:
            'bg-geometric-pattern bg-cover bg-full pt-20 pb-24 relative h-1/4',
        },
        m('div', { class: 'container mx-auto' }, [
          m(
            'h2',
            { class: 'mt-28 text-5xl text-left font-bold mb-2 md:text-center' },
            ' Crypto-native communities deserve crypto-native software. '
          ),
          m(
            'p',
            {
              class:
                'text-xl text-gray-600 mb-12 mt-4 text-left md:text-center',
            },
            ' Combine multiple tools in one. '
          ),
          m(
            'div',
            m(
              'div',
              { class: 'text-center mt-8 ' },
              m(
                'a',
                { class: 'btn-outline text-xl px-7 rounded-lg pb-3', href: '' },
                'See docs'
              )
            )
          ),
        ])
      ),
      m('section', { class: 'container mx-auto p-10' }, [
        m('div', [
          m(
            'p',
            { class: 'mt-4 text-xl text-gray-600 text-center ' },
            ' The medium is the message.'
          ),
          m(
            'h2',
            { class: 'mt-4 text-3xl text-center  font-bold' },
            ' Threads help drive thoughtful conversation. '
          ),
          m(
            'p',
            {
              class:
                'mt-6 mb-8 text-xl text-gray-600 text-center mx-auto  w-full md:w-3/4 ',
            },
            ' On Commonwealth, threads leave space for your community members to engage in thoughtful conversation. Curate threads by grouping them into featured tags, or lock threads to a select group of community members. '
          ),
        ]),
        m(
          'div',
          { class: 'flex justify-center max-w-5xl max-h-2xl shadow-2xl' },
          m('img', { src: 'static/img/chatCommonWealth.svg', alt: '' })
        ),
      ]),
      m(
        'section',
        { class: 'bg-white' },
        m(
          'div',
          { class: 'container mx-auto p-10 ' },
          m('div', { class: 'grid grid-cols-1 lg:grid-cols-2  gap-10 mb-40' }, [
            m('div', { class: 'mt-10' }, [
              m(
                'p',
                { class: 'mt-4 text-xl text-gray-600 text-left ' },
                ' Your tech should match your values.'
              ),
              m(
                'h2',
                { class: 'mt-4 text-3xl text-left  font-bold' },
                ' Crypto-native integrations for the most popular protocols. '
              ),
              m(
                'p',
                { class: 'mt-8 text-xl text-gray-600 text-left ' },
                ' No matter what protocol you build on, give easy access to your project’s most important on-chain actions like staking and voting. Commonwealth has a growing list of integrations--including Ethereum, NEAR, Cosmos, Substrate, and popular DAO frameworks like Moloch or Aragon. '
              ),
            ]),
            m('div', { class: 'grid grid-cols-2 ' }, [
              m(
                'div',
                { class: 'relative' },
                m(
                  'div',
                  { class: 'absolute mt-10' },
                  m('img', { src: 'static/img/ethToken.svg', alt: '' })
                )
              ),
              m(
                'div',
                { class: 'relative' },
                m(
                  'div',
                  { class: 'absolute' },
                  m('img', { src: 'static/img/nToken.svg', alt: '' })
                )
              ),
              m(
                'div',
                { class: 'relative' },
                m(
                  'div',
                  { class: 'absolute mt-20' },
                  m('img', { src: 'static/img/diabloToken.svg', alt: '' })
                )
              ),
              m(
                'div',
                { class: 'relative' },
                m(
                  'div',
                  { class: 'absolute mt-10' },
                  m('img', { src: 'static/img/rToken.svg', alt: '' })
                )
              ),
            ]),
          ])
        )
      ),
      m(
        'section',
        { class: 'bg-white' },
        m(
          'div',
          { class: 'container mx-auto p-10' },
          m('div', { class: 'grid grid-cols-2 mb-12' }, [
            m(
              'div',
              { class: 'flex justify-left' },
              m(
                'div',
                m('img', { src: 'static/img/commonWealthFork.svg', alt: '' })
              )
            ),
            m('div', { class: 'mt-10' }, [
              m(
                'h2',
                { class: 'mt-4 text-3xl text-left font-bold' },
                ' Commonwealth is open. '
              ),
              m(
                'p',
                { class: 'mt-8 text-xl text-gray-600 text-left ' },
                ' Fork, develop, alter, share - Commonwealth is explicitly designed for open-source ecosystems. Existing solutions like chat and email lock your data, users, and brand into platforms you don’t control. Default openness allows new members to discover you through SEO. '
              ),
            ]),
          ])
        )
      ),
      m('section', { class: 'container mx-auto p-10 mb-20' }, [
        m('div', { class: 'mt-10' }, [
          m(
            'h2',
            { class: 'mt-4 text-3xl text-center  font-bold' },
            ' Commonwealth compared '
          ),
          m(
            'p',
            { class: 'mt-4 text-xl text-gray-600 text-center mb-10' },
            ' Commonwealth combines all the features of your favorite tools into a single platform. '
          ),
        ]),
        m('div', m('img', { src: 'static/img/wealthTable.svg', alt: '' })),
      ]),
      m(FooterLandingPage, {
        list: [
          { text: 'Why Commonwealth?', redirectTo: '/whyCommonWealth' },
          // { text:  'Use Cases' },
          // { text:  'Crowdfunding' },
          // { text:  'Developers' },
          // { text:  'About us' },
          // { text:  'Carrers' }
        ],
      }),
    ]);
  },
};

export default WhyCommonWealthView;
