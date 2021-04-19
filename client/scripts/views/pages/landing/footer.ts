import m from 'mithril';

const FooterLandingPage: m.Component<{}, {}> = {
  view: (vnode) => {
    return m(
      'footer',
      { class: 'bg-footer bg-cover py-10' },
      m(
        'div',
        {
          class:
            'mt-8 container mx-auto md:flex md:flex-row md:justify-between md:items-start',
        },
        [
          m('img', {
            class: 'w-60',
            src: 'static/img/logo.svg',
            alt: 'Commonwealth',
          }),
          m(
            'nav',
            { class: 'mt-10 md:mt-0 w-64' },
            m('ul', { class: 'flex flex-wrap flex-col h-32' }, [
              m(
                'li',
                { class: 'mb-2' },
                m(
                  'a',
                  { class: 'text-gray-500', href: '' },
                  'Why Commonwealth?'
                )
              ),
              m(
                'li',
                { class: 'mb-2' },
                m('a', { class: 'text-gray-500', href: '' }, 'Use Cases')
              ),
              m(
                'li',
                { class: 'mb-2' },
                m('a', { class: 'text-gray-500', href: '' }, 'Crowdfounding')
              ),
              m(
                'li',
                { class: 'mb-2' },
                m('a', { class: 'text-gray-500', href: '' }, 'Developers')
              ),
              m(
                'li',
                { class: 'mb-2' },
                m('a', { class: 'text-gray-500', href: '' }, 'About Us')
              ),
              m(
                'li',
                { class: 'mb-2' },
                m('a', { class: 'text-gray-500', href: '' }, 'Careers')
              ),
            ])
          ),
        ]
      )
    );
  },
};

export default FooterLandingPage;
