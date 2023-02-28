/* @jsx m */

import ClassComponent from 'class_component';
import { parseCustomStages, threadStageToLabel } from 'helpers';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import $ from 'jquery';
import m from 'mithril';

import app from 'state';

class EntryPage extends ClassComponent<{
  onSave: () => void;
  onCancel: () => void;
}> {
  view() {
    return (
      <div class="entry-page">
        <h1>Entry Page</h1>
      </div>
    );
  }
}

class Alert extends ClassComponent<{
  onClose: () => void;
  onSetUsername: () => void;
}> {
  view() {
    return (
      <div class="alert">
        <h1>Alert</h1>
      </div>
    );
  }
}

class Success extends ClassComponent<{ onClose: () => void }> {
  view() {
    return (
      <div class="success">
        <h1>Success</h1>
      </div>
    );
  }
}

type UnifiedUserFlowModalAttrs = {};

type modalStages = 'entry-page' | 'alert' | 'success';

export class UnifiedUserFlowModal extends ClassComponent<UnifiedUserFlowModalAttrs> {
  private modalStage: modalStages;

  view(vnode) {
    return (
      <div class="UnifiedUserFlowModal">
        {this.modalStage === 'entry-page' && (
          <EntryPage
            onCancel={() => {
              this.modalStage = 'alert';
            }}
            onSave={() => {
              this.modalStage = 'success';
            }}
          />
        )}
        {this.modalStage === 'alert' && (
          <Alert
            onSetUsername={() => {
              this.modalStage === 'entry-page';
            }}
            onClose={() => {
              console.log('hi');
            }}
          />
        )}
        {this.modalStage === 'success' && (
          <Success
            onClose={() => {
              console.log('closed');
            }}
          />
        )}
      </div>
    );
  }
}
