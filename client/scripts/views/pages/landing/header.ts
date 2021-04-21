import m from 'mithril';
import './landing_page_header.scss';

interface IState {
  navs: { text: string; ref: string }[];
}

const HeaderLandingPage: m.Component<IState, IState> = {
  oninit: (vnode: m.VnodeDOM<IState, IState>) => {
    vnode.state.navs = vnode.attrs.navs;
  },
  view: (vnode) => {
    return m(
      'div',
      { class: 'mt-8 container mx+auto' },
      m(
        'header',
        {
          class:
            'bg-white lg:flex lg:flex-row lg:justify-between lg:items-center p-4 px-10 rounded-full shadow-lg',
        },
        [
          m('img', {
            class: 'w-32 md:w-48 lg:w-60',
            src: 'static/img/logo.svg',
            alt: 'Commonwealth',
          }),
          m(
            'nav',
            { class: 'hidden lg:block' },
            m('ul', { class: 'lg:flex lg:flex-row lg:items-center' }, [
              vnode.state.navs.map((nav: any) => {
                return m(
                  'li.LandingPageHeaderLinks',
                  { class: 'ml-10' },
                  m(
                    'a',
                    { class: 'text-gray-500 leading-none', href: nav.href },
                    nav.text
                  )
                );
              }),
              m(
                'li.LandingPageHeaderLinks',
                { class: 'ml-10' },
                m('a', { class: 'btn-primary pb-3', href: '' }, [
                  m('img', {
                    class: 'inline mr-1.5',
                    src: 'static/img/user.svg',
                    alt: 'Login',
                  }),
                  ' Login ',
                ])
              ),
            ])
          ),
        ]
      )
    );
  },
};

export default HeaderLandingPage;
