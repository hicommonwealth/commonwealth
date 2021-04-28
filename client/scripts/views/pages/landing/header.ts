import m from 'mithril';
import './landing_page_header.scss';
import app from 'state';
import LoginModal from 'views/modals/login_modal';

interface IAttrs {
  navs: { text: string; ref: string }[];
}

interface IState {
  headerMinimized: boolean;
  hideHeader: boolean;
}

// eslint-disable-next-line max-len
const INITIAL_HEADER_STYLE = 'bg-white lg:flex lg:flex-row lg:justify-between lg:items-center p-4 px-10 rounded-full shadow-lg z-20 transition transform translate-y-0 translate-x-64 transition-all duration-1000 w-2/4 ml-12';

window.onscroll = (e: any): void => {
  if (window.scrollY > 50) {
    document.getElementById(
      'landing-page'
    ).className = `fixed ${INITIAL_HEADER_STYLE} transform -translate-y-4`;
  }

  if (window.scrollY - window.innerHeight > 0) {
    document.getElementById(
      'landing-page'
    ).className = `header-hidden static${INITIAL_HEADER_STYLE} transform -translate-y-8`;
  }
};

const HeaderLandingPage: m.Component<IAttrs, IState> = {
  view: (vnode) => {
    return m(
      'header',
      {
        id: 'landing-page',
        class: INITIAL_HEADER_STYLE,
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
            vnode.attrs.navs.map((nav: any) => {
              return m(
                'li.LandingPageHeaderLinks',
                { class: 'ml-10 pt-2' },
                m(
                  'a',
                  { class: 'text-gray-500 leading-none', href: nav.href },
                  nav.text
                )
              );
            }),
            m(
              'li.LandingPageHeaderLoginButton',
              { class: 'ml-10 pt-2' },
              m(
                'a',
                {
                  class: 'btn-primary pb-3 text-white',
                  onclick: () => app.modals.create({ modal: LoginModal }),
                },
                [
                  m('img', {
                    class: 'inline mr-1.5',
                    src: 'static/img/user.svg',
                    alt: 'Login',
                  }),
                  ' Login ',
                ]
              )
            ),
          ])
        ),
      ]
    );
  },
};

export default HeaderLandingPage;
