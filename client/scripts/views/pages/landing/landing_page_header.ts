import m from 'mithril';
import 'pages/landing/landing_page_header.scss';
import app from 'state';
import LoginModal from 'views/modals/login_modal';

interface IAttrs {
  navs: { text: string; redirectTo: string }[];
  scrollHeader: boolean;
}

interface IState {
  headerMinimized: boolean;
  hideHeader?: boolean;
}

// eslint-disable-next-line max-len
const INITIAL_HEADER_STYLE =  'bg-white static lg:flex lg:flex-row lg:justify-between lg:items-center p-4 lg:mx-auto lg:p-0 lg:px-20 px-10  shadow-lg ';

const triggerMenu = () => {
  const headerClass = document.getElementById('landing-page');
  if (headerClass.classList.contains('menuOpen')) {
    headerClass.className = `landing-header ${INITIAL_HEADER_STYLE} mt-8 `;
  } else {
    headerClass.className = `landing-header ${INITIAL_HEADER_STYLE} mt-8 menuOpen`;
  }

};


const scrollingHeader = () => {
  if (window.scrollY < 36) {
    document.getElementById(
      'landing-page'
    ).className = `landing-header ${INITIAL_HEADER_STYLE} mt-8`;
  }

  if (window.scrollY > 36) {
    document.getElementById(
      'landing-page'
    ).className = `fixed ${INITIAL_HEADER_STYLE} lg:mx-28 mt-8 fixed-header `;
  }

  if (window.scrollY - window.innerHeight > 0) {
    document.getElementById(
      'landing-page'
    ).className = `header-hidden ${INITIAL_HEADER_STYLE} mt-8`;
  }
};

const HeaderLandingPage: m.Component<IAttrs, IState> = {
  oninit: (vnode) => {
    if (vnode.attrs.scrollHeader) {
      window.addEventListener('scroll', scrollingHeader);
    }
  },
  onremove: (vnode) => {
    if (vnode.attrs.scrollHeader) {
      window.removeEventListener('scroll', scrollingHeader);
    }
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
          class: `landing-header ${INITIAL_HEADER_STYLE}     mt-8`,
        },
        [
          m('img', {
            class: 'w-40 md:w-48 lg:w-60',
            src: '/static/img/logo.svg',
            alt: 'Commonwealth',
            style: m.route.get() === '/' ? '' : 'cursor:pointer',
            onclick: () => redirectClick('/'),
          }),
          m(
            'nav',
            { class: 'lg:block hidden' },
            m('ul', { class: 'lg:flex lg:flex-row lg:items-center' }, [
              vnode.attrs.navs.map((nav: any) => {
                return m(
                  'li.LandingPageHeaderLinks',
                  { class: 'ml-10 py-8 lg:flex' },
                  m(
                    'a',
                    {
                      class: 'text-2xl lg:text-base text-gray-500 leading-none',
                      onclick: () => redirectClick(nav.redirectTo),
                    },
                    nav.text
                  )
                );
              }),
              m(
                'li.LandingPageHeaderLoginButton',
                { class: ' ml-5 md:ml-10 lg:pt-0 ' },
                m(
                  'a',
                  {
                    class: ' block text-lg text-center btn-primary md:pb-3 text-white text-xs md:text-base lg:inline',
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
          m(
            'button',
            {
              class: 'menuButton lg:hidden',
              onclick: () => triggerMenu(),
            },
            [
              m('img', {
                class: 'inline mr-1.5 menu',
                src: 'static/img/menu.svg',
                alt: 'Menu icon',
              }),
              m('img', {
                class: 'inline mr-1.5 close',
                src: 'static/img/close.svg',
                alt: 'Close icon',
              })
            ]
          )
        ]
      )
    );
  },
};

export default HeaderLandingPage;
