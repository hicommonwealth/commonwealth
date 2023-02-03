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
import $ from 'jquery';

import 'pages/feed/index.scss';

import app from 'state';
import Sublayout from '../../sublayout';
import { PageLoading } from '../loading';

class FeedPage extends ClassComponent {
  private isLoading: boolean;

  private getGlobalFeed = async () => {
    try {
      const result = await $.post(`${app.serverUrl()}/viewGlobalActivity`);
    } catch (err) {
      console.log('error', err);
    }
  }

  oninit() {
    this.isLoading = true;
    this.getGlobalFeed();
    this.isLoading = false;
  }

  view() {
    if (this.isLoading) {
      return <PageLoading />;
    }

    return (
      <Sublayout>
        <div className="FeedPage">
          Feed
        </div>
      </Sublayout>
    );
  }
}

export default FeedPage;