import m from 'mithril';

const HeaderLandingPage: m.Component<{}, {}> = {
  view: (vnode) => {
    return m(
      'header',
      {
        class:
          'bg-white lg:flex lg:flex-row lg:justify-between lg:items-center p-4 px-10 rounded-full shadow-lg',
      },
      [
        m('img', {
          class: 'w-32 md:w-48 lg:w-60',
          src: 'assets/img/logo.svg',
          alt: 'Commonwealth',
        }),
        m(
          'nav',
          { class: 'hidden lg:block' },
          m('ul', { class: 'lg:flex lg:flex-row lg:items-center' }, [
            m(
              'li',
              { class: 'ml-10' },
              m(
                'a',
                { class: 'text-gray-500 leading-none', href: '' },
                'Why Commonwealth?'
              )
            ),
            m(
              'li',
              { class: 'ml-10' },
              m(
                'a',
                {
                  class: 'text-gray-500 leading-none',
                  href: 'useCases.html',
                },
                'Use Cases'
              )
            ),
            m(
              'li',
              { class: 'ml-10' },
              m(
                'a',
                { class: 'text-gray-500 leading-none', href: '' },
                'Crowdfounding'
              )
            ),
            m(
              'li',
              { class: 'ml-10' },
              m(
                'a',
                { class: 'text-gray-500 leading-none', href: '' },
                'Developers'
              )
            ),
            m(
              'li',
              { class: 'ml-10' },
              m('a', { class: 'btn-primary pb-3', href: '' }, [
                m('img', {
                  class: 'inline mr-1.5',
                  src: 'assets/img/user.svg',
                  alt: 'Login',
                }),
                ' Login ',
              ])
            ),
          ])
        ),
      ]
    );
  },
};

export default HeaderLandingPage;
