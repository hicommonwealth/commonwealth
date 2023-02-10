
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

export class JoinCommonWealthSection extends ClassComponent {
  view() {
    return (
      <section className="h-80 bg-gray-900 flex items-center mt-20 h-56">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between">
            <div>
              <h2 className="text-white font-bold text-3xl">
                A community for every token.
              </h2>
              <p className="text-xl text-gray-400">Join Commonwealth today.</p>
            </div>
          </div>
        </div>
      </section>
    );
  }
}
