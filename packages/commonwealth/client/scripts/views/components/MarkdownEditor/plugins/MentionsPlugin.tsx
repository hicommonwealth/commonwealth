/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  MenuTextMatch,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin';
import { TextNode } from 'lexical';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import * as ReactDOM from 'react-dom';

import {
  addActivePlugin$,
  addComposerChild$,
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  addToMarkdownExtension$,
  realmPlugin,
  ToMarkdownExtension,
} from 'commonwealth-mdxeditor';
import { MentionLexicalExportVisitor } from 'views/components/MarkdownEditor/plugins/MentionLexicalExportVisitor';
import { MentionMdastImportVisitor } from 'views/components/MarkdownEditor/plugins/MentionMdastImportVisitor';
import {
  $createMentionNode,
  MentionNodeAsTextNode,
} from './MentionNodeAsTextNode';

const PUNCTUATION =
  '\\.,\\+\\*\\?\\$\\@\\|#{}\\(\\)\\^\\-\\[\\]\\\\/!%\'"~=<>_:;';
const NAME = '\\b[A-Z][^\\s' + PUNCTUATION + ']';

const DocumentMentionsRegex = {
  NAME,
  PUNCTUATION,
};

const PUNC = DocumentMentionsRegex.PUNCTUATION;

const TRIGGERS = ['@'].join('');

// Chars we expect to see in a mention (non-space, non-punctuation).
const VALID_CHARS = '[^' + TRIGGERS + PUNC + '\\s]';

// Non-standard series of chars. Each series must be preceded and followed by
// a valid char.
const VALID_JOINS =
  '(?:' +
  '\\.[ |$]|' + // E.g. "r. " in "Mr. Smith"
  ' |' + // E.g. " " in "Josh Duck"
  '[' +
  PUNC +
  ']|' + // E.g. "-' in "Salier-Hellendag"
  ')';

const LENGTH_LIMIT = 75;

const AtSignMentionsRegex = new RegExp(
  '(^|\\s|\\()(' +
    '[' +
    TRIGGERS +
    ']' +
    '((?:' +
    VALID_CHARS +
    VALID_JOINS +
    '){0,' +
    LENGTH_LIMIT +
    '})' +
    ')$',
);

// 50 is the longest alias length limit.
const ALIAS_LENGTH_LIMIT = 50;

// Regex used to match alias.
const AtSignMentionsRegexAliasRegex = new RegExp(
  '(^|\\s|\\()(' +
    '[' +
    TRIGGERS +
    ']' +
    '((?:' +
    VALID_CHARS +
    '){0,' +
    ALIAS_LENGTH_LIMIT +
    '})' +
    ')$',
);

// At most, 5 suggestions are shown in the popup.
const SUGGESTION_LIST_LENGTH_LIMIT = 5;

const mentionsCache = new Map();

type Mention = {
  handle: string;
  uid: string;
};

const dummyMentionsData: Mention[] = [
  { handle: 'Alice', uid: '123' },
  { handle: 'Bob', uid: '234' },
  { handle: 'Carol', uid: '345' },
];

const dummyLookupService = {
  search(string: string, callback: (results: Array<Mention>) => void): void {
    setTimeout(() => {
      const results = dummyMentionsData.filter((mention) =>
        mention.handle.toLowerCase().includes(string.toLowerCase()),
      );
      callback(results);
    }, 500);
  },
};

function useMentionLookupService(mentionString: string | null) {
  const [results, setResults] = useState<Array<Mention>>([]);

  useEffect(() => {
    const cachedResults = mentionsCache.get(mentionString);

    if (mentionString == null) {
      setResults([]);
      return;
    }

    if (cachedResults === null) {
      return;
    } else if (cachedResults !== undefined) {
      setResults(cachedResults);
      return;
    }

    mentionsCache.set(mentionString, null);
    dummyLookupService.search(mentionString, (newResults) => {
      mentionsCache.set(mentionString, newResults);
      setResults(newResults);
    });
  }, [mentionString]);

  return results;
}

function checkForAtSignMentions(
  text: string,
  minMatchLength: number,
): MenuTextMatch | null {
  let match = AtSignMentionsRegex.exec(text);

  if (match === null) {
    match = AtSignMentionsRegexAliasRegex.exec(text);
  }
  if (match !== null) {
    // The strategy ignores leading whitespace but we need to know it's
    // length to add it to the leadOffset
    const maybeLeadingWhitespace = match[1];

    const matchingString = match[3];
    if (matchingString.length >= minMatchLength) {
      return {
        leadOffset: match.index + maybeLeadingWhitespace.length,
        matchingString,
        replaceableString: match[2],
      };
    }
  }
  return null;
}

function getPossibleQueryMatch(text: string): MenuTextMatch | null {
  return checkForAtSignMentions(text, 1);
}

class MentionTypeaheadOption extends MenuOption {
  name: string;
  uid: string;

  constructor(mention: Mention) {
    super(mention.handle);
    this.name = mention.handle;
    this.uid = mention.uid;
  }
}

const MentionsTypeaheadMenuItem = ({
  index,
  isSelected,
  onClick,
  onMouseEnter,
  option,
}: {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  option: MentionTypeaheadOption;
}) => {
  let className = 'item';
  if (isSelected) {
    className += ' selected';
  }
  return (
    <li
      key={option.key}
      tabIndex={-1}
      className={className}
      ref={option.setRefElement}
      role="option"
      aria-selected={isSelected}
      id={'typeahead-item-' + index}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
    >
      {/*{option.picture}*/}
      <span className="text">{option.name}</span>
    </li>
  );
};

export const NewMentionsPlugin = (): JSX.Element | null => {
  const [editor] = useLexicalComposerContext();

  const [queryString, setQueryString] = useState<string | null>(null);

  const results = useMentionLookupService(queryString);

  const checkForSlashTriggerMatch = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  });

  const options = useMemo(
    () =>
      results
        .map((result) => new MentionTypeaheadOption(result))
        .slice(0, SUGGESTION_LIST_LENGTH_LIMIT),
    [results],
  );

  const onSelectOption = useCallback(
    (
      selectedOption: MentionTypeaheadOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const mentionNode = $createMentionNode(
          selectedOption.name,
          selectedOption.uid,
        );
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode);
        }
        mentionNode.select();
        closeMenu();
      });
    },
    [editor],
  );

  const checkForMentionMatch = useCallback(
    (text: string) => {
      const slashMatch = checkForSlashTriggerMatch(text, editor);
      if (slashMatch !== null) {
        return null;
      }
      return getPossibleQueryMatch(text);
    },
    [checkForSlashTriggerMatch, editor],
  );

  return (
    <LexicalTypeaheadMenuPlugin<MentionTypeaheadOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForMentionMatch}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) =>
        anchorElementRef.current && results.length
          ? ReactDOM.createPortal(
              <div className="typeahead-popover mentions-menu">
                <ul>
                  {options.map((option, i: number) => (
                    <MentionsTypeaheadMenuItem
                      index={i}
                      isSelected={selectedIndex === i}
                      onClick={() => {
                        setHighlightedIndex(i);
                        selectOptionAndCleanUp(option);
                      }}
                      onMouseEnter={() => {
                        setHighlightedIndex(i);
                      }}
                      key={option.key}
                      option={option}
                    />
                  ))}
                </ul>
              </div>,
              anchorElementRef.current,
            )
          : null
      }
    />
  );
};

/**
 * Create an extension for `mdast-util-to-markdown` to enable directives in
 * markdown.
 *
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable directives.
 */
export function mentionToMarkdown(): ToMarkdownExtension {
  console.log('FIXME: mentionToMarkdown');
  return {
    // unsafe: [
    //   {
    //     character: '\r',
    //     inConstruct: ['leafDirectiveLabel', 'containerDirectiveLabel'],
    //   },
    //   {
    //     character: '\n',
    //     inConstruct: ['leafDirectiveLabel', 'containerDirectiveLabel'],
    //   },
    //   {
    //     before: '[^:]',
    //     character: ':',
    //     after: '[A-Za-z]',
    //     inConstruct: ['phrasing'],
    //   },
    //   { atBreak: true, character: ':', after: ':' },
    // ],
    // FIXME: I think this is what I might need to fix.
    handlers: {
      //   // containerDirective: handleDirective,
      //   // leafDirective: handleDirective,
      //   // textDirective: handleDirective
      containerDirective: () => {
        console.log('FIXME containerDirective');
        return 'FIXME';
      },
      leafDirective: () => {
        console.log('FIXME leafDirective');
        return 'FIXME';
      },
      textDirective: () => {
        console.log('FIXME textDirective');
        return 'FIXME';
      },
    },
  };
}

export const mentionsPlugin = realmPlugin<{}>({
  // update: (realm, params) => {
  //   // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  //   // realm.pub(directiveDescriptors$, params?.directiveDescriptors ?? [])
  // },
  //
  // // TODO: this has the same methods as the link plugin but I'm not sure how the
  // // link plugin defines the mentions...
  // // I *think* I might need these:
  // //   [addMdastExtension$]: directiveFromMarkdown(),
  // //   [addSyntaxExtension$]: directive(),
  //
  // // TODO: OK, the linkPlugin MUST be used or links can't be parsed so something must be triggering it!!
  // // OK... one debug strategy is to make the mention plugin work just like the
  // // link plugin and then make whatever changes are required to get it to work.
  //
  init: (realm, params) => {
    realm.pubIn({
      [addActivePlugin$]: 'mention',
      [addImportVisitor$]: MentionMdastImportVisitor,
      [addLexicalNode$]: MentionNodeAsTextNode,
      [addExportVisitor$]: MentionLexicalExportVisitor,
      // FIXME: I think this is the one I need now...
      [addToMarkdownExtension$]: mentionToMarkdown(),
      [addComposerChild$]: () => (
        <>
          <NewMentionsPlugin />
        </>
      ),
    });
  },
});
