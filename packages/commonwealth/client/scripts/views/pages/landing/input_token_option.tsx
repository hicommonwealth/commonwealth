/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

const ADD_TOKEN_LINK = 'https://hicommonwealth.typeform.com/to/cRP27Rp5';

type InputTokenOptionComponentAttrs = {
  iconImg: string;
  text: string;
  route: string;
};

export class InputTokenOptionComponent extends ClassComponent<InputTokenOptionComponentAttrs> {
  view(vnode) {
    const { iconImg } = vnode.attrs;

    let tokenImage;

    if (!iconImg || !iconImg.length || iconImg.slice(0, 4) === 'ipfs') {
      tokenImage = (
        <div class="TokenIcon">
          <div
            class="token-icon.no-image"
            style="width: 1.5rem; height: 1.5rem; margin-right: 1rem;"
            onclick={onclick}
          >
            <span style="font-size: 1.25rem;">
              {vnode.attrs.text.slice(0, 1)}
            </span>
          </div>
        </div>
      );
    } else {
      tokenImage = <img class="mr-4 h-6 w-6" src={iconImg} alt="" />;
    }
    return (
      <li>
        <button
          type="button"
          onclick={(e) => {
            if (vnode.attrs.route === 'placeholder') {
              e.preventDefault();
              window.location.href = ADD_TOKEN_LINK;
            } else {
              e.preventDefault();
              localStorage['home-scrollY'] = window.scrollY;
              m.route.set(`/${vnode.attrs.route}`);
            }
          }}
          class={`p-3 rounded hover:bg-gray-100 flex flex-grow items-center flex-row
           text-left leading-none w-full justify-between focus:outline-none`}
        >
          <span class="flex flex-row font-bold">
            {tokenImage}
            <span class="mt-1">{vnode.attrs.text}</span>
          </span>
        </button>
      </li>
    );
  }
}
