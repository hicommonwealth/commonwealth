/* @jsx m */

import ClassComponent from 'class_component';
import { parseCustomStages, threadStageToLabel } from 'helpers';
import type { SnapshotProposal } from 'helpers/snapshot_utils';
import $ from 'jquery';
import m from 'mithril';

import 'modals/unified_user_flow_modal.scss';

import app from 'state';
import { CWButton } from '../components/component_kit/cw_button';
import { CWCard } from '../components/component_kit/cw_card';
import { CWIcon } from '../components/component_kit/cw_icons/cw_icon';
import { CWText } from '../components/component_kit/cw_text';
import { CWTextInput } from '../components/component_kit/cw_text_input';

class EntryPage extends ClassComponent<{
  onSave: () => void;
  onCancel: () => void;
}> {
  view(vnode) {
    const { onSave, onCancel } = vnode.attrs;

    return (
      <div class="EntryModal">
        <div class="Header">
          <CWText type="caption" fontWeight="bold">
            INTRODUCING
          </CWText>
          <CWText type="h3" fontWeight="bold">
            Unified User Profiles
          </CWText>
        </div>
        <div class="Description">
          <CWText type="b1">
            With this update you'll have a single display name across all your
            communities, making it easier to connect and engage with others.
          </CWText>
          <CWText type="b1">
            This change will go into effect March 8th, 2023. To prepare, provide
            a display name below.
          </CWText>
        </div>
        <div class="Inputs">
          <CWText type="caption">Display Name</CWText>
          <CWTextInput
            label="Enter a display name"
            placeholder="ex: commoncow123"
          />
        </div>
        <div class="Callout">
          <CWText>
            Please note that your current activity and actions will NOT be
            erased. Only your current profile name will be replaced by your new
            display name.
          </CWText>
        </div>
        <div class="MoreInfo">
          <CWText>Want a deeper understanding of this change?</CWText>
          <CWText className="blue-text">Learn more</CWText>
        </div>
        <div class="ButtonRow">
          <CWButton
            buttonType="secondary-black"
            label="Cancel"
            onclick={() => {
              onCancel();
            }}
          />
          <CWButton
            buttonType="primary-black"
            label="Save"
            onclick={() => {
              onSave();
            }}
          />
        </div>
      </div>
    );
  }
}

class Alert extends ClassComponent<{
  onClose: () => void;
  onSetUsername: () => void;
}> {
  view(vnode) {
    const { onClose, onSetUsername } = vnode.attrs;

    return (
      <div class="AlertDangerModal">
        <div class="Header">
          <CWIcon iconName="cautionCircle" size="large" />
          <CWText type="h4" fontWeight="bold">
            Important
          </CWText>
        </div>
        <div class="Description">
          <CWText type="b1">
            No display name has been provided. Please note that if you do not
            provide a display name, the following will occur.
          </CWText>
        </div>
        <div class="Callout">
          <CWText fontWeight="bold">One Profile</CWText>
          <CWText>
            If you have only one profile, your current profile name will be used
            as your default username. However, keep in mind that you won't be
            able to change it later.
          </CWText>
        </div>
        <div class="Callout">
          <CWText fontWeight="bold">Multipe Profiles</CWText>
          <CWText>
            If you have multiple profiles and you don't specify a username, each
            of your profiles will be converted to different accounts.
          </CWText>
        </div>
        <div class="Description">
          <CWText type="b1">
            To avoid any confusion or inconvenience, please make sure to provide
            a unique and memorable username when prompted. Thank you for your
            cooperation.
          </CWText>
        </div>
        <div class="ButtonRow">
          <CWButton
            buttonType="secondary-red"
            label="Close"
            onclick={() => {
              onClose();
            }}
          />
          <CWButton
            buttonType="primary-black"
            label="Set Username"
            onclick={() => {
              onSetUsername();
            }}
          />
        </div>
      </div>
    );
  }
}

class Success extends ClassComponent<{ onClose: () => void }> {
  view(vnode) {
    const { onClose } = vnode.attrs;

    return (
      <div class="SuccessProfileModal">
        <div class="Header">
          <CWText type="h4" fontWeight="bold">
            🎉 Success!
          </CWText>
        </div>
        <div class="Description">
          <CWText type="b1">
            Great news! You've just created your unique username. Starting March
            8th, your current profile name will be replaced with the new
            username you provided.
          </CWText>
        </div>

        <div class="ButtonRow">
          <CWButton
            buttonType="primary-black"
            label="Close"
            onclick={() => {
              onClose();
            }}
          />
        </div>
      </div>
    );
  }
}

type UnifiedUserFlowModalAttrs = {};

type modalStages = 'entry-page' | 'alert' | 'success';

export class UnifiedUserFlowModal extends ClassComponent<UnifiedUserFlowModalAttrs> {
  private modalStage: modalStages = 'entry-page';

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
              this.modalStage = 'entry-page';
              console.log('hu');
              m.redraw();
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
