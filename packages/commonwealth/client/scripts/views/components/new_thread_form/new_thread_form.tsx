import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import { capitalize } from 'lodash';
import type { DeltaStatic } from 'quill';

import 'components/new_thread_form.scss';

import { notifyError } from 'controllers/app/notifications';
import type { Topic, Account } from 'models';
import { ThreadKind, ThreadStage } from 'models';
import app from 'state';
import { detectURL } from 'helpers/threads';
import { CWTab, CWTabBar } from 'views/components/component_kit/cw_tabs';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWTextInput } from 'views/components/component_kit/cw_text_input';
import { CWButton } from 'views/components/component_kit/cw_button';
import { Modal } from 'views/components/component_kit/cw_modal';
import { EditProfileModal } from 'views/modals/edit_profile_modal';
import { useCommonNavigate } from 'navigation/helpers';
import type { NewThreadFormType } from 'views/components/new_thread_form/types';
import {
  checkNewThreadErrors,
  updateTopicList,
} from 'views/components/new_thread_form/helpers';

export const NewThreadForm = () => {
  const navigate = useCommonNavigate();
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [form, setForm] = useState<NewThreadFormType>({
    // TODO topic - this is temporary just to make submit pass
    topic: app.topics.getByCommunity(app.activeChainId())[0],
    // topic: null,
    title: localStorage.getItem(`${app.activeChainId()}-new-link-storedTitle`),
    url: localStorage.getItem(`${app.activeChainId()}-new-link-storedLink`),
    kind: ThreadKind.Discussion,
  });
  const [authorName, setAuthorName] = useState(
    app.user.activeAccount?.profile?.name
  );
  const [activeTopic, setActiveTopic] = useState<Topic>(null);
  const [saving, setSaving] = useState(false);
  const [value1, setValue1] = useState<DeltaStatic>();

  const chainId = app.activeChainId();
  const author = app.user.activeAccount;
  const isAdmin = app.roles.isAdminOfEntity({ chain: chainId });
  const hasTopics = !!app.topics.getByCommunity(app.chain.id).length;

  const disableSave = !author || saving;
  const topicMissing = hasTopics && !form?.topic;
  const linkContentMissing = form.kind === ThreadKind.Link && !form.url;
  const discussionContentMissing =
    form.kind === ThreadKind.Discussion && (!value1 || !form?.title);

  const disableSubmission =
    disableSave ||
    topicMissing ||
    linkContentMissing ||
    discussionContentMissing;

  const _newThread = async (
    _form: NewThreadFormType,
    _value1: DeltaStatic,
    _author: Account,
    stage = ThreadStage.Discussion
  ) => {
    const deltaString = JSON.stringify(_value1);
    checkNewThreadErrors(_form, deltaString);

    try {
      const result = await app.threads.create(
        _author.address,
        _form.kind,
        stage,
        app.activeChainId(),
        _form.title,
        _form.topic,
        deltaString,
        form.url
      );

      navigate(`/discussion/${result.id}`);
      updateTopicList(result.topic, app.chain);
    } catch (e) {
      throw new Error(e);
    }
  };

  return (
    <>
      <div className="NewThreadForm">
        <div className="new-thread-header">
          <CWTabBar>
            <CWTab
              label={capitalize(ThreadKind.Discussion)}
              isSelected={form.kind === ThreadKind.Discussion}
              onClick={() => {
                setForm((prevState) => ({
                  ...prevState,
                  kind: ThreadKind.Discussion,
                }));
              }}
            />
            <CWTab
              label={capitalize(ThreadKind.Link)}
              isSelected={form.kind === ThreadKind.Link}
              onClick={() => {
                setForm((prevState) => ({
                  ...prevState,
                  kind: ThreadKind.Link,
                }));
              }}
            />
          </CWTabBar>
        </div>
        <div className="new-thread-body">
          <div className="new-thread-form-inputs">
            {!authorName && (
              <div className="set-display-name-callout">
                <CWText>You haven't set a display name yet.</CWText>
                <a onClick={() => setIsEditProfileModalOpen(true)}>
                  Set a display name
                </a>
              </div>
            )}

            {form.kind === ThreadKind.Discussion && (
              <>
                <div className="topics-and-title-row">
                  <CWTextInput
                    autoFocus
                    name="new-thread-title"
                    placeholder="Title"
                    value={form.title}
                    tabIndex={2}
                    onInput={(e) => {
                      const { value } = e.target;
                      setForm((prevState) => ({ ...prevState, title: value }));
                      localStorage.setItem(
                        `${chainId}-new-discussion-storedTitle`,
                        form.title
                      );
                    }}
                  />
                </div>

                <div>
                  <ReactQuill
                    theme="snow"
                    onChange={(value, delta, source, editor) => {
                      setValue1(editor.getContents());
                    }}
                  />
                </div>

                <div className="buttons-row">
                  <CWButton
                    disabled={disableSubmission}
                    onClick={async () => {
                      setSaving(true);

                      try {
                        await _newThread(form, value1, author);
                        setSaving(false);
                      } catch (err) {
                        setSaving(false);
                        notifyError(err.message);
                      }
                    }}
                    label="Create thread"
                    tabIndex={4}
                  />
                </div>
              </>
            )}

            {form.kind === ThreadKind.Link && hasTopics && (
              <>
                <div className="topics-and-title-row">
                  <CWTextInput
                    placeholder="Title"
                    name="new-link-title"
                    value={form.title}
                    tabIndex={3}
                    onInput={(e) => {
                      const { value } = e.target;
                      setForm((prevState) => ({ ...prevState, title: value }));
                      localStorage.setItem(
                        `${chainId}-new-link-storedTitle`,
                        form.title
                      );
                    }}
                  />
                </div>
                <CWTextInput
                  placeholder="https://"
                  value={form.url}
                  tabIndex={2}
                  onInput={(e) => {
                    const { value } = e.target;
                    setForm((prevState) => ({ ...prevState, url: value }));
                    localStorage.setItem(
                      `${chainId}-new-link-storedLink`,
                      form.url
                    );
                  }}
                />

                <CWButton
                  label="Create thread"
                  disabled={disableSubmission}
                  onClick={async () => {
                    if (!detectURL(form.url)) {
                      notifyError('Must provide a valid URL.');
                      return;
                    }

                    setSaving(true);

                    try {
                      await _newThread(form, value1, author);
                      setSaving(false);
                    } catch (err) {
                      setSaving(false);
                      notifyError(err.message);
                    }
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
      <Modal
        content={
          <EditProfileModal
            onModalClose={() => {
              setIsEditProfileModalOpen(false);
            }}
            account={app.user.activeAccount}
          />
        }
        onClose={() => {
          setIsEditProfileModalOpen(false);
        }}
        open={isEditProfileModalOpen}
      />
    </>
  );
};
