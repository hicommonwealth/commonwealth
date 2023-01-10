/* @jsx m */

import ClassComponent from 'class_component';
import m from 'mithril';

import 'pages/landing/find_your_community_section.scss';

type Holder = {
  alt: string;
  img: string;
  text: string;
  title: string;
};

type TokenHoldersComponentAttrs = {
  holders: Array<Holder>;
};

export class TokenHoldersComponent extends ClassComponent<TokenHoldersComponentAttrs> {
  private holders: Array<Holder>;

  oninit(vnode: m.Vnode<TokenHoldersComponentAttrs>) {
    this.holders = vnode.attrs.holders;
  }

  view() {
    return (
      <section class="LandingPageTokenHolders container mx-auto pt-20">
        <h2 class="text-3xl font-bold mb-5 text-center">
          Token holders come together
        </h2>
        <p class="text-2xl max-w-screen-sm mx-auto text-center mb-10">
          Find your community and drive your token forward.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-20">
          {this.holders.map((holder) => {
            return (
              <div class="text-center lg:text-left">
                <img
                  class="w-28 h-28 mx-auto lg:mx-0"
                  src={holder.img}
                  alt={holder.alt}
                />
                <h3 class="mt-4 text-2xl font-bold mb-1">{holder.title}</h3>
                <p class="text-lg">{holder.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    );
  }
}
