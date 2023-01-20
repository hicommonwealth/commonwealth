/* @jsx jsx */

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
  jsx,
} from 'mithrilInterop';

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
  view(vnode: ResultNode<ListedCardWithImageAttrs>) {
    return (
      <li className="lg:flex-grow">
        <div className="lg:flex lg:flex-row">
          <div className="lg:w-1/3 lg:mr-5 xl:mr-20 p-1 rounded-2xl transition hover:transition-all duration-500">
            <button
              className={`rounded-2xl p-5 text-left w-full focus:outline-none transition transition-all duration-500 ${
                vnode.attrs.isTabHoverActive
                  ? `${vnode.attrs.tabHoverColorClick}`
                  : ''
              }  ${vnode.attrs.variant}`}
              onClick={vnode.attrs.handleClick}
              id={vnode.attrs.buttonId}
            >
              <h4
                className={`${
                  vnode.attrs.textType === 'black' ? '' : 'text-white'
                } font-bold text-xl`}
              >
                {vnode.attrs.title}
              </h4>
              <p
                id={vnode.attrs.subtitleId}
                className={`${
                  vnode.attrs.isTabHoverActive ? '' : 'invisible'
                } ${vnode.attrs.textType === 'black' ? '' : 'text-white'}`}
              >
                {vnode.attrs.subtitle}
              </p>
            </button>
          </div>
          <div
            className={`${
              vnode.attrs.imageActive ? 'block' : 'invisible'
            }  lg:w-2/3 lg:absolute lg:w-2/3 lg:right-0 lg:top-0`}
            id={vnode.attrs.cardId}
          >
            <img
              className={`TokensCreatorsImage ${
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
