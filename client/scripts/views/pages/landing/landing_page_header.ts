import m from 'mithril';
import 'pages/landing/landing_page_header.scss';
import app from 'state';
import LoginModal from 'views/modals/login_modal';

interface IAttrs {
  navs: { text: string; redirectTo: string }[];
}

interface IState {
  headerMinimized: boolean;
  hideHeader: boolean;
}

// eslint-disable-next-line max-len
const INITIAL_HEADER_STYLE =  'bg-white static lg:flex lg:flex-row lg:justify-between lg:items-center p-4 px-10 rounded-full shadow-lg transition transition-all duration-1000';

const scrollingHeader = () => {
  if (window.scrollY < 50) {
    document.getElementById(
      'landing-page'
    ).className = `landing-header  ${INITIAL_HEADER_STYLE} mx-16 sm:mx-32 md:mx-32 lg:mx-12 xl:mx-32 mt-8 w-3/5 sm:w-2/4 md:w-2/4 lg:w-3/5  `;
  }

  if (window.scrollY > 50) {
    document.getElementById(
      'landing-page'
    ).className = `fixed ${INITIAL_HEADER_STYLE} mx-16 sm:mx-32 md:mx-48 lg:mx-28 xl:mx-48 mt-8 w-3/5 sm:w-2/4 md:w-2/4 lg:w-3/5`;
  }

  if (window.scrollY - window.innerHeight > 0) {
    document.getElementById(
      'landing-page'
    ).className = `header-hidden ${INITIAL_HEADER_STYLE}  mx-16 sm:mx-32 md:mx-32 lg:mx-12 xl:mx-32 mt-8 w-3/5 sm:w-2/4 md:w-2/4 lg:w-3/5 `;
  }
};

const HeaderLandingPage: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    window.addEventListener('scroll', scrollingHeader);
  },
  onremove: (vnode) => {
    window.removeEventListener('scroll', scrollingHeader);
  },
  view: (vnode) => {
    const redirectClick = (route) => {
      m.route.set(route);
    };

    return m(
      '.HeaderLandingPage',
      { class: 'container mx-auto' },
      m(
        'header',
        {
          id: 'landing-page',
          class: `landing-header ${INITIAL_HEADER_STYLE}  mx-16 sm:mx-32 md:mx-32 lg:mx-12 xl:mx-32 mt-8 w-3/5 sm:w-2/4 md:w-2/4 lg:w-3/5 `,
        },
        [
          m('img', {
            class: 'w-32 md:w-48 lg:w-60',
            src: 'static/img/logo.svg',
            alt: 'Commonwealth',
            onclick: () => redirectClick('/'),
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
                    {
                      class: 'text-gray-500 leading-none',
                      onclick: () => redirectClick(nav.redirectTo),
                    },
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
