/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

type ListedCardWithImageAttrs = {
  buttonId: string;
  cardId: string;
  handleClick: (creator) => void;
  imageActive: boolean;
  imageAlt: string;
  imageSrc: string;
  isTabHoverActive: boolean;
  subtitle: string;
  subtitleId?: string;
  tabHoverColorClick: string;
  textType?: string;
  title: string;
  variant?: string;
};

export class ListedCardWithImage extends ClassComponent<ListedCardWithImageAttrs> {
  view(vnode: m.Vnode<ListedCardWithImageAttrs>) {
    return (
      <li class="lg:flex-grow">
        <div class="lg:flex lg:flex-row">
          <div class="lg:w-1/3 lg:mr-5 xl:mr-20 p-1 rounded-2xl transition hover:transition-all duration-500">
            <button
              class={`rounded-2xl p-5 text-left w-full focus:outline-none transition transition-all duration-500 ${
                vnode.attrs.isTabHoverActive
                  ? `${vnode.attrs.tabHoverColorClick}`
                  : ''
              }  ${vnode.attrs.variant}`}
              onclick={vnode.attrs.handleClick}
              id={vnode.attrs.buttonId}
            >
              <h4
                class={`${
                  vnode.attrs.textType === 'black' ? '' : 'text-white'
                } font-bold text-xl`}
              >
                {vnode.attrs.title}
              </h4>
              <p
                id={vnode.attrs.subtitleId}
                class={`${vnode.attrs.isTabHoverActive ? '' : 'invisible'} ${
                  vnode.attrs.textType === 'black' ? '' : 'text-white'
                }`}
              >
                {vnode.attrs.subtitle}
              </p>
            </button>
          </div>
          <div
            class={`${
              vnode.attrs.imageActive ? 'block' : 'invisible'
            }  lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0`}
            id={vnode.attrs.cardId}
          >
            <img
              class={`TokensCreatorsImage ${
                vnode.attrs.imageActive ? 'block' : 'hidden'
              } block max-w-2xl w-full h-auto`}
              src={vnode.attrs.imageSrc}
              alt={vnode.attrs.imageAlt}
            />
          </div>
        </div>
      </li>
    );
  }
}
