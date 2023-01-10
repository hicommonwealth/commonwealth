/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import 'pages/landing/landing_page_header.scss';

import app from 'state';
import { NewLoginModal } from 'views/modals/login_modal';
import { isWindowMediumSmallInclusive } from '../../components/component_kit/helpers';

// eslint-disable-next-line max-len
const INITIAL_HEADER_STYLE = `bg-white static lg:flex lg:flex-row lg:justify-between
 lg:items-center p-4 lg:mx-auto lg:p-0 lg:px-20 px-10 shadow-lg`;

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

type HeaderLandingPageAttrs = {
  navs: Array<{ text: string; redirectTo: string }>;
  scrollHeader: boolean;
};

export class HeaderLandingPage extends ClassComponent<HeaderLandingPageAttrs> {
  oninit(vnode: m.Vnode<HeaderLandingPageAttrs>) {
    if (vnode.attrs.scrollHeader) {
      window.addEventListener('scroll', scrollingHeader);
    }
  }

  onremove(vnode: m.Vnode<HeaderLandingPageAttrs>) {
    if (vnode.attrs.scrollHeader) {
      window.removeEventListener('scroll', scrollingHeader);
    }
  }

  view(vnode: m.Vnode<HeaderLandingPageAttrs>) {
    const redirectClick = (route) => {
      m.route.set(route);
    };

    return (
      <div class="HeaderLandingPage container mx-auto">
        <header
          id="landing-page"
          class={`landing-header ${INITIAL_HEADER_STYLE} mt-8`}
        >
          <img
            src="static/img/commonLogoWithText.svg"
            alt="Commonwealth"
            class="logoWithText"
          />
          <nav class="lg:block hidden">
            <ul class="lg:flex lg:flex-row lg:items-center">
              {vnode.attrs.navs.map((nav: any) => {
                return (
                  <li class="LandingPageHeaderLinks ml-10 py-8 lg:flex">
                    <a
                      class="text-2xl lg:text-base text-gray-500 leading-none"
                      onclick={() => redirectClick(nav.redirectTo)}
                    >
                      {nav.text}
                    </a>
                  </li>
                );
              })}
              <li class="LandingPageHeaderLoginButton ml-5 md:ml-10 lg:pt-0">
                <a
                  class="block text-lg text-center btn-primary md:pb-3 text-white text-xs md:text-base lg:inline"
                  style="padding: 8px 16px"
                  onclick={() =>
                    app.modals.create({
                      modal: NewLoginModal,
                      data: {
                        modalType: isWindowMediumSmallInclusive(
                          window.innerWidth
                        )
                          ? 'fullScreen'
                          : 'centered',
                        breakpointFn: isWindowMediumSmallInclusive,
                      },
                    })
                  }
                >
                  <img
                    class="inline mr-1.5"
                    style="padding: 0"
                    src="static/img/user.svg"
                    alt="Login"
                  />{' '}
                  Login
                </a>
              </li>
            </ul>
          </nav>
          <button class="menuButton lg:hidden" onclick={() => triggerMenu()}>
            <img
              class="inline mr-1.5 menu"
              src="static/img/menu.svg"
              alt="Menu icon"
            />
            <img
              class="inline mr-1.5 close"
              src="static/img/close.svg"
              alt="Close icon"
            />
          </button>
        </header>
      </div>
    );
  }
}
