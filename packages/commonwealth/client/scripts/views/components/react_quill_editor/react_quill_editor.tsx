import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { DeltaOperation, RangeStatic } from 'quill';
import imageDropAndPaste from 'quill-image-drop-and-paste';
import ReactQuill, { Quill } from 'react-quill';
import QuillMention from 'quill-mention';
import moment from 'moment';

import { SerializableDeltaStatic, restoreDraft, saveDraft } from './utils';
import { base64ToFile, getTextFromDelta, uploadFileToS3 } from './utils';

import app from 'state';
import { CWText } from '../component_kit/cw_text';
import { CWIconButton } from '../component_kit/cw_icon_button';
import { PreviewModal } from '../../modals/preview_modal';
import { Modal } from '../component_kit/cw_modal';

import 'components/react_quill/react_quill_editor.scss';
import 'react-quill/dist/quill.snow.css';
import { nextTick } from 'process';

import { MinimumProfile } from 'models';
import { openConfirmation } from 'views/modals/confirmation_modal';
import { LoadingIndicator } from './loading_indicator';
import { debounce } from 'lodash';

const VALID_IMAGE_TYPES = ['jpeg', 'gif', 'png'];

const Delta = Quill.import('delta');
Quill.register('modules/imageDropAndPaste', imageDropAndPaste);
Quill.register('modules/mention', QuillMention);

type ReactQuillEditorProps = {
  className?: string;
  placeholder?: string;
  tabIndex?: number;
  contentDelta: SerializableDeltaStatic;
  setContentDelta: (d: SerializableDeltaStatic) => void;
  draftKey?: string;
};

// ReactQuillEditor is a custom wrapper for the react-quill component
const ReactQuillEditor = ({
  className = '',
  placeholder,
  tabIndex,
  contentDelta,
  setContentDelta,
  draftKey,
}: ReactQuillEditorProps) => {
  const editorRef = useRef<ReactQuill>();

  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isMarkdownEnabled, setIsMarkdownEnabled] = useState<boolean>(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState<boolean>(false);

  // ref is used to prevent rerenders when selection
  // is changed, since rerenders bug out the editor
  const lastSelectionRef = useRef<RangeStatic | null>(null);

  // refreshQuillComponent unmounts and remounts the
  // React Quill component, as this is the only way
  // to refresh the component if the 'modules'
  // prop is changed
  const refreshQuillComponent = () => {
    setIsVisible(false);
    nextTick(() => {
      setIsVisible(true);
    });
  };

  const handleChange = (value, delta, source, editor) => {
    setContentDelta({
      ...editor.getContents(),
      ___isMarkdown: isMarkdownEnabled,
    } as SerializableDeltaStatic);
  };

  // must be memoized or else infinite loop
  const handleImageDropAndPaste = useCallback(
    async (imageDataUrl, imageType) => {
      const editor = editorRef.current?.editor;

      try {
        if (!editor) {
          throw new Error('editor is not set');
        }

        setIsUploading(true);

        editor.disable();

        if (!imageType) {
          imageType = 'image/png';
        }

        const selectedIndex =
          editor.getSelection()?.index || editor.getLength() || 0;

        // filter out ops that contain a base64 image
        const opsWithoutBase64Images: DeltaOperation[] = (
          editor.getContents() || []
        ).filter((op) => {
          for (const opImageType of VALID_IMAGE_TYPES) {
            const base64Prefix = `data:image/${opImageType};base64`;
            if (op.insert?.image?.startsWith(base64Prefix)) {
              return false;
            }
          }
          return true;
        });
        setContentDelta({
          ops: opsWithoutBase64Images,
          ___isMarkdown: isMarkdownEnabled,
        } as SerializableDeltaStatic);

        const file = base64ToFile(imageDataUrl, imageType);

        const uploadedFileUrl = await uploadFileToS3(
          file,
          app.serverUrl(),
          app.user.jwt
        );

        // insert image op at the selected index
        if (isMarkdownEnabled) {
          editor.insertText(selectedIndex, `![image](${uploadedFileUrl})`);
        } else {
          editor.insertEmbed(selectedIndex, 'image', uploadedFileUrl);
        }
        setContentDelta({
          ...editor.getContents(),
          ___isMarkdown: isMarkdownEnabled,
        } as SerializableDeltaStatic); // sync state with editor content
      } catch (err) {
        console.error(err);
      } finally {
        editor.enable();
        setIsUploading(false);
      }
    },
    [editorRef, isMarkdownEnabled, setContentDelta]
  );

  const handleToggleMarkdown = () => {
    const editor = editorRef.current?.getEditor();

    if (!editor) {
      throw new Error('editor not set');
    }
    // if enabling markdown, confirm and remove formatting
    const newMarkdownEnabled = !isMarkdownEnabled;

    if (newMarkdownEnabled) {
      const isContentAvailable =
        getTextFromDelta(editor.getContents()).length > 0;

      if (isContentAvailable) {
        openConfirmation({
          title: 'Warning',
          description: <>All formatting and images will be lost. Continue?</>,
          buttons: [
            {
              label: 'Yes',
              buttonType: 'mini-red',
              onClick: () => {
                editor.removeFormat(0, editor.getLength());
                setIsMarkdownEnabled(newMarkdownEnabled);
                setContentDelta({
                  ...editor.getContents(),
                  ___isMarkdown: newMarkdownEnabled,
                });
              },
            },
            {
              label: 'No',
              buttonType: 'mini-white',
            },
          ],
        });
      } else {
        setIsMarkdownEnabled(newMarkdownEnabled);
      }
    } else {
      setIsMarkdownEnabled(newMarkdownEnabled);
    }
  };

  const handlePreviewModalClose = () => {
    setIsPreviewVisible(false);
  };

  // must be memoized or else infinite loop
  const clipboardMatchers = useMemo(() => {
    return [
      [
        Node.ELEMENT_NODE,
        (node, delta) => {
          return delta.compose(
            new Delta().retain(delta.length(), {
              header: false,
              align: false,
              color: false,
              background: false,
            })
          );
        },
      ],
    ];
  }, []);

  // if markdown is disabled, hide toolbar buttons
  const toolbar = useMemo(() => {
    if (isMarkdownEnabled) {
      return [];
    }
    return ([[{ header: 1 }, { header: 2 }]] as any).concat([
      ['bold', 'italic', 'strike'],
      ['link', 'code-block', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
    ]);
  }, [isMarkdownEnabled]);

  const selectMention = useCallback(
    (item: QuillMention) => {
      const editor = editorRef.current?.getEditor();
      if (!editor) {
        return;
      }
      if (item.link === '#' && item.name === '') return;
      const text = editor.getText();
      const lastSelection = lastSelectionRef.current;
      if (!lastSelection) {
        return;
      }
      const cursorIdx = lastSelection.index;
      const mentionLength =
        text.slice(0, cursorIdx).split('').reverse().indexOf('@') + 1;
      const beforeText = text.slice(0, cursorIdx - mentionLength);
      const afterText = text.slice(cursorIdx).replace(/\n$/, '');
      const delta = new Delta()
        .retain(beforeText.length)
        .delete(mentionLength)
        .insert(`@${item.name}`, { link: item.link });
      if (!afterText.startsWith(' ')) delta.insert(' ');
      editor.updateContents(delta);
      editor.setSelection(
        editor.getLength() -
          afterText.length -
          (afterText.startsWith(' ') ? 0 : 1),
        0
      );
    },
    [lastSelectionRef]
  );

  const mention = useMemo(() => {
    return {
      allowedChars: /^[A-Za-z0-9\sÅÄÖåäö\-_.]*$/,
      mentionDenotationChars: ['@'],
      dataAttributes: ['name', 'link', 'component'],
      renderItem: (item) => item.component,
      onSelect: selectMention,
      source: async (
        searchTerm: string,
        renderList: (
          formattedMatches: QuillMention,
          searchTerm: string
        ) => null,
        mentionChar: string
      ) => {
        if (mentionChar !== '@') return;

        let formattedMatches = [];
        if (searchTerm.length === 0) {
          const node = document.createElement('div');
          const tip = document.createElement('span');
          tip.innerText = 'Type to tag a member';
          node.appendChild(tip);
          formattedMatches = [
            {
              link: '#',
              name: '',
              component: node.outerHTML,
            },
          ];
        } else if (searchTerm.length > 0) {
          const members = await app.search.searchMentionableAddresses(
            searchTerm,
            {
              pageSize: 10,
              chainScope: app.activeChainId(),
            }
          );
          formattedMatches = members.map((addr) => {
            const profile = app.newProfiles.getProfile(
              addr.chain,
              addr.address
            );
            const node = document.createElement('div');

            let avatar;
            if (profile.avatarUrl) {
              avatar = document.createElement('img');
              (avatar as HTMLImageElement).src = profile.avatarUrl;
              avatar.className = 'ql-mention-avatar';
              node.appendChild(avatar);
            } else {
              avatar = document.createElement('div');
              avatar.className = 'ql-mention-avatar';
              avatar.innerHTML = MinimumProfile.getSVGAvatar(addr.address, 20);
            }

            const nameSpan = document.createElement('span');
            nameSpan.innerText = addr.name;
            nameSpan.className = 'ql-mention-name';

            const addrSpan = document.createElement('span');
            addrSpan.innerText =
              addr.chain === 'near'
                ? addr.address
                : `${addr.address.slice(0, 6)}...`;
            addrSpan.className = 'ql-mention-addr';

            const lastActiveSpan = document.createElement('span');
            lastActiveSpan.innerText = profile.lastActive
              ? `Last active ${moment(profile.lastActive).fromNow()}`
              : null;
            lastActiveSpan.className = 'ql-mention-la';

            const textWrap = document.createElement('div');
            textWrap.className = 'ql-mention-text-wrap';

            node.appendChild(avatar);
            textWrap.appendChild(nameSpan);
            textWrap.appendChild(addrSpan);
            textWrap.appendChild(lastActiveSpan);
            node.appendChild(textWrap);

            return {
              link: `/profile/id/${addr.profile_id}`,
              name: addr.name,
              component: node.outerHTML,
            };
          });
        }
        renderList(formattedMatches, searchTerm);
      },
      isolateChar: true,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when markdown state is changed, add markdown metadata to delta ops
  // and refresh quill component
  useEffect(() => {
    const editor = editorRef.current?.getEditor();
    if (editor) {
      setContentDelta({
        ...editor.getContents(),
        ___isMarkdown: isMarkdownEnabled,
      } as SerializableDeltaStatic);
    }
    refreshQuillComponent();
  }, [isMarkdownEnabled, setContentDelta]);

  // when initialized, update markdown state to match content type
  useEffect(() => {
    if (!editorRef.current) {
      return;
    }
    setIsMarkdownEnabled(!!contentDelta?.___isMarkdown);
    // sometimes a force refresh is needed to render the editor
    setTimeout(() => {
      refreshQuillComponent();
    }, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef]);

  const debouncedSaveDraft = useCallback(debounce(saveDraft, 300), []);

  // when content updated, save draft
  useEffect(() => {
    debouncedSaveDraft(draftKey, contentDelta);
  }, [debouncedSaveDraft, draftKey, contentDelta]);

  // when initialized, restore draft
  useEffect(() => {
    if (!editorRef.current || !draftKey) {
      return;
    }
    const restoredDelta = restoreDraft(draftKey);
    if (restoredDelta) {
      setContentDelta(restoredDelta.contentDelta);
      setIsMarkdownEnabled(!!restoredDelta.contentDelta?.___isMarkdown);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorRef]);

  return (
    <div className="QuillEditorWrapper">
      {isUploading && <LoadingIndicator />}
      <Modal
        content={
          <PreviewModal
            doc={
              isMarkdownEnabled ? getTextFromDelta(contentDelta) : contentDelta
            }
            onModalClose={handlePreviewModalClose}
            title={isMarkdownEnabled ? 'As Markdown' : 'As Rich Text'}
          />
        }
        onClose={handlePreviewModalClose}
        open={isPreviewVisible}
      />
      <div className="custom-buttons">
        {isMarkdownEnabled && (
          <CWText
            type="h5"
            fontWeight="semiBold"
            className="custom-button"
            title="Switch to RichText mode"
            onClick={handleToggleMarkdown}
          >
            R
          </CWText>
        )}
        {!isMarkdownEnabled && (
          <CWText
            type="h5"
            fontWeight="semiBold"
            className="custom-button"
            title="Switch to Markdown mode"
            onClick={handleToggleMarkdown}
          >
            M
          </CWText>
        )}
        <CWIconButton
          className="custom-button preview"
          iconName="search"
          iconSize="small"
          iconButtonTheme="primary"
          onClick={(e) => {
            e.preventDefault();
            setIsPreviewVisible(true);
          }}
        />
      </div>
      {isVisible && (
        <ReactQuill
          ref={editorRef}
          className={`QuillEditor ${className}`}
          placeholder={placeholder}
          tabIndex={tabIndex}
          theme="snow"
          value={contentDelta}
          onChange={handleChange}
          onChangeSelection={(selection: RangeStatic) => {
            if (!selection) {
              return;
            }
            lastSelectionRef.current = selection;
          }}
          modules={{
            toolbar,
            imageDropAndPaste: {
              handler: handleImageDropAndPaste,
            },
            clipboard: {
              matchers: clipboardMatchers,
            },
            mention,
          }}
        />
      )}
    </div>
  );
};

export default ReactQuillEditor;
