import m from 'mithril';

const TokenHoldersComponent: m.Component<{}, {}> = {
  view: (vnode) => {
    return m('section', { class: 'container mx-auto pt-20' }, [
      m(
        'h2',
        { class: 'text-3xl font-extrabold mb-5 text-center' },
        ' Token holders come together '
      ),
      m(
        'p',
        { class: 'text-2xl max-w-screen-sm mx-auto text-center mb-10' },
        ' Find your community and drive your token forward. '
      ),
      m(
        'div',
        { class: 'text-center' },
        m(
          'a',
          { class: 'btn-outline text-xl px-6 rounded-lg pb-3', href: '' },
          'Find your community'
        )
      ),
      m(
        'div',
        {
          class: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20',
        },
        [
          m('div', { class: 'text-center lg:text-left' }, [
            m('img', {
              class: 'mb-9 w-12 h-auto mx-auto lg:mx-0',
              src: 'assets/img/near-protocol.png',
              alt: '',
            }),
            m(
              'h3',
              { class: 'text-2xl font-extrabold mb-1' },
              'Claim your token'
            ),
            m(
              'p',
              { class: 'text-xl' },
              ' We generate pages for your favorite community and address from real-time chain actvity. Claim yours. '
            ),
          ]),
          m('div', { class: 'text-center lg:text-left' }, [
            m('img', {
              class: 'mb-9 w-12 h-auto mx-auto lg:mx-0',
              src: 'assets/img/near-protocol.png',
              alt: '',
            }),
            m('h3', { class: 'text-2xl font-extrabold mb-1' }, 'Stay updated'),
            m(
              'p',
              { class: 'text-xl' },
              ' Be the first to know when community events are happening with in-app, email, and mobile push notiications. '
            ),
          ]),
          m('div', { class: 'text-center lg:text-left' }, [
            m('img', {
              class: 'mb-9 w-12 h-auto mx-auto lg:mx-0',
              src: 'assets/img/near-protocol.png',
              alt: '',
            }),
            m(
              'h3',
              { class: 'text-2xl font-extrabold mb-1' },
              'Participate in events.'
            ),
            m(
              'p',
              { class: 'text-xl' },
              ' Participate in events like upcoming votes, new projects and community initiatives. '
            ),
          ]),
          m('div', { class: 'text-center lg:text-left' }, [
            m('img', {
              class: 'mb-9 w-12 h-auto mx-auto lg:mx-0',
              src: 'assets/img/near-protocol.png',
              alt: '',
            }),
            m(
              'h3',
              { class: 'text-2xl font-extrabold mb-1' },
              'Your community is here.'
            ),
            m(
              'p',
              { class: 'text-xl' },
              ' Stop bouncing between 10 tabs at once - everything you need to know about your token is here. '
            ),
          ]),
        ]
      ),
    ]);
  },
};

export default TokenHoldersComponent;
