/* @jsx m */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import m from 'mithril';

import 'components/loading_row.scss';

export const LoadingRow = (
  <div class="LoadingRow">
    <div class="proposal-row">
      <div class="proposal-left">
        <div class="title-block" />
        <br />
        <div class="metadata-block" />
      </div>
      <div class="proposal-center">
        <div class="content-block" />
        <div class="content-block" />
        <div class="content-block" />
      </div>
    </div>
  </div>
);
