
import React from 'react';

import {
  ClassComponent,
  ResultNode,
  render,
  setRoute,
  getRoute,
  getRouteParam,
  redraw,
  Component,
  } from 'mithrilInterop';

const ADD_TOKEN_LINK = 'https://hicommonwealth.typeform.com/to/cRP27Rp5';

type InputTokenOptionComponentAttrs = {
  iconImg: string;
  text: string;
  route: string;
};

export class InputTokenOptionComponent extends ClassComponent<InputTokenOptionComponentAttrs> {
  view(vnode: ResultNode<InputTokenOptionComponentAttrs>) {
    const { iconImg } = vnode.attrs;

    let tokenImage;

    if (!iconImg || !iconImg.length || iconImg.slice(0, 4) === 'ipfs') {
      tokenImage = (
        <div className="TokenIcon">
          <div
            className="token-icon.no-image"
            style={{ width: '1.5rem', height: '1.5rem', marginRight: '1rem' }}
          >
            <span className="font-size: 1.25rem;">
              {vnode.attrs.text.slice(0, 1)}
            </span>
          </div>
        </div>
      );
    } else {
      tokenImage = <img className="mr-4 h-6 w-6" src={iconImg} alt="" />;
    }
    return (
      <li>
        <button
          type="button"
          onClick={(e) => {
            if (vnode.attrs.route === 'placeholder') {
              e.preventDefault();
              window.location.href = ADD_TOKEN_LINK;
            } else {
              e.preventDefault();
              localStorage['home-scrollY'] = window.scrollY;
              setRoute(`/${vnode.attrs.route}`);
            }
          }}
          className={`p-3 rounded hover:bg-gray-100 flex flex-grow items-center flex-row
           text-left leading-none w-full justify-between focus:outline-none`}
        >
          <span className="flex flex-row font-bold">
            {tokenImage}
            <span className="mt-1">{vnode.attrs.text}</span>
          </span>
        </button>
      </li>
    );
  }
}
