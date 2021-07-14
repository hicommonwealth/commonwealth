import './commonwealth.scss';
import m from 'mithril';

import GeometricPatternSection from './geometric_pattern_section';
import HeaderLandingPage from '../landing/landing_page_header';
import FooterLandingPage from '../landing/landing_page_footer';
import LandingPageButton from '../landing/landing_page_button';

const WhyCommonWealthView: m.Component<{}, {}> = {
  view: (vnode) => {
    return m('div', [
      m(
        'div',
        { class: 'absolute w-screen z-20' },
        m(HeaderLandingPage, {
          scrollHeader: true,
          navs: [
            { text: 'Why Commonwealth?', redirectTo: '/whyCommonwealth' },
            // { text: 'Use Cases' },
            // { text: 'Crowdfunding' },
            // { text: 'Developers' },
          ],
        })
      ),
      m(
        GeometricPatternSection,
        m('div.WhyCommonWealthInitialSection', { class: 'container mx-auto' }, [
          m(
            'h2',
            { class: 'mt-24 text-4xl sm:text-5xl text-left font-bold mb-2 md:text-center leading-tight pl-6 pr-6' },
            ' Crypto-native communities deserve crypto-native software. '
          ),
          m(
            'p',
            {
              class:
                'text-xl text-gray-600 mb-12 mt-4 text-center',
            },
            ' Combine multiple tools in one. '
          ),
          m(
            'div',
            m(
              'div.SeeDocsButton',
              { class: 'text-center hidden lg:block xl:block mb-20' },
              m(LandingPageButton, { href: '', text: 'See docs' })
            )
          ),
        ])
      ),
      m('section', { class: 'container mx-auto p-10' }, [
        m(
          'div',
          {
            class: 'md:w-5/6 mx-auto',
          },
          [
            m(
              'p.Gradient-purple-text',
              { class: 'mt-20 text-xl text-gray-600 text-center ' },
              ' The medium is the message.'
            ),
            m(
              'h2',
              { class: 'mt-4 text-3xl text-center  font-bold' },
              ' Threads drive thoughtful conversation. '
            ),
            m(
              'p',
              {
                class:
                  'mt-6 mb-20 text-xl text-gray-600 text-center mx-auto  w-full md:w-5/6 ',
              },
              ' On Commonwealth, threads leave space for your community members to engage in thoughtful conversation. Curate threads by grouping them into featured tags, or lock threads to a select group of community members. '
            ),
          ]
        ),
        m(
          'div',
          { class: 'flex justify-center max-w-5xl max-h-2xl shadow-2xl' },
          m('img', { src: 'static/img/chatCommonWealth.svg', alt: '' })
        ),
      ]),
      m('section', { class: 'container mx-auto' }, [
        m(
          'div',
          { class: 'mt-20' },
          m('img', {
            class: 'mx-auto my-auto',
            src: 'static/img/group-87.svg',
            alt: '',
          })
        ),
        m(
          'h2',
          { class: 'text-4xl sm:text-5xl text-left font-bold mb-2 md:text-center -mt-10 sm:-mt-20"' },
          'Integrate your existing community tools. '
        ),
        m(
          'div',
          { class: 'grid md:grid-cols-5' },
          m(
            'div',
            { class: 'md:col-start-2 md:col-span-3' },
            m(
              'p',
              {
                class:
                  'text-xl text-gray-600 mb-12 mt-4 text-left md:text-center',
              },
              'Commonwealth helps break down silos between chat apps like Discord, Telegram, and Riot by providing integrations for webhooks and bridges. Your community will be able to receive Commonwealth notifications wherever they are most comfortable.'
            )
          )
        ),
      ]),
      m(
        'section',
        { class: 'bg-white' },
        m(
          'div',
          { class: 'container mx-auto p-10 ' },
          m(
            'div',
            { class: 'grid grid-cols-1 lg:grid-cols-2  gap-10 mb-64 mt-10 sm:mt-40' },
            [
              m('div', { class: 'mt-10' }, [
                m(
                  'p.Gradient-purple-text',
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
              m('div', { class: 'grid grid-cols-4 lg:grid-cols-2 ' }, [
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
            ]
          )
        )
      ),
      m(
        'section',
        { class: 'bg-white' },
        m(
          'div',
          { class: 'container mx-auto p-10' },
          m('div', { class: 'grid md:grid-cols-2 mb-40' }, [
            m(
              'div',
              { class: 'flex justify-left' },
              m(
                'div',
                m('img', { class: 'mt-40 md:mt-1', src: 'static/img/commonWealthFork.svg', alt: '' })
              )
            ),
            m('div', { class: 'mt-10 lg:-ml-20 ' }, [
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
        m('div', { class: 'mt-10 md:w-100 sm:w-2/4 text-center mx-auto' }, [
          m(
            'h2',
            { class: 'mt-4 text-3xl text-center  font-bold' },
            ' Commonwealth compared '
          ),
          m(
            'p',
            { class: 'mt-4 text-xl text-gray-600 text-center mb-20' },
            ' Commonwealth combines all the features of your favorite tools into a single platform. '
          ),
        ]),
        m(
          'div',
          {
            class: 'mb-20 overflow-x-scroll',
          },
          m('img', {
            src: 'static/img/wealthTable.svg',
            alt: '',
            class: 'cwTable mx-auto',
          })
        ),
      ]),
      m(FooterLandingPage, {
        list: [
          { text: 'Blog', externalLink: 'https://blog.commonwealth.im' },
          { text: 'Jobs', externalLink: 'https://angel.co/company/commonwealth-labs/jobs' },
          { text:  'Terms', redirectTo:  '/terms' },
          { text:  'Privacy', redirectTo: '/privacy' },
          { text: 'Discord', externalLink: 'https://discord.gg/ZFQCKUMP' },
          { text: 'Telegram', externalLink: 'https://t.me/HiCommonwealth' }
          // { text:  'Use Cases' },
          // { text:  'Crowdfunding' },
          // { text:  'Developers' },
          // { text:  'About us' },
          // { text:  'Careers' }
        ],
      }),
    ]);
  },
};

export default WhyCommonWealthView;
