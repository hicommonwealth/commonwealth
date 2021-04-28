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
const INITIAL_HEADER_STYLE = 'bg-white lg:flex lg:flex-row lg:justify-between lg:items-center p-4 px-10 rounded-full shadow-lg z-20';

window.onscroll = (e: any): void => {
  if (window.scrollY > 100) {
    document.getElementById(
      'landing-page'
    ).className = `w-2/4 fixed ${INITIAL_HEADER_STYLE}`;
  }

  if (window.scrollY - window.innerHeight > 0) {
    document.getElementById(
      'landing-page'
    ).className = `w-100 ${INITIAL_HEADER_STYLE}`;
  }
};

const HeaderLandingPage: m.Component<IAttrs, IState> = {
  view: (vnode) => {
    return m(
      'div',
      {},
      m(
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
      )
    );
  },
};

export default HeaderLandingPage;
