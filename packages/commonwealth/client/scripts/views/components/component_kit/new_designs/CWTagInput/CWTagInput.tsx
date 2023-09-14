import React, { useRef, useState } from 'react';
import { CWIcon } from '../../cw_icons/cw_icon';
import './CWTagInput.scss';

type TagInputProps = {
  defaultTags?: string[];
  tagSuggestions?: string[];
  onInputChange?: (e: any) => any;
  canAddCustomTags?: boolean;
  placeholder?: string;
  filterMatchingTagSuggestionsOnInputChange?: boolean;
  // TODO: add size variants
  // TODO: add more customizeability - for now the current one is good
  // IMPORTANT: Not extending base react node props (used in this file) availability to parnet component is intentional
  // ex: all `input` props are intentionally not extended for parnet components (this avoids unncessary clutter and
  // confusion in component usage)
  // IMPORTANT: try to avoid adding new props, we can do a lot with the current ones. The ones that make some sense are
  // - onTagsChange (import: adding onTagAdd/onTagRemove might be repetitive) - doesn't bring much value ATM
  // - maybe 'defaultTags' to use custom react nodes (like do 'action' when 'x-tag' is clicked) - doesn't bring much value ATM
  // - maybe play with the 'placeholder' prop to show/hide on different cases (there are some unattended
  // states) - doesn't bring much value ATM
  // - disabled - we can play around with this in many different ways - this is a nice to add
  // - canRemoveTags - we can use the 'disabled' prop for this (again something to play around with & find a
  // fit) - this is a nice to add
};

const Tag = ({ children, onRemove = () => null, canRemove = true }) => {
  return (
    <button className="tag">
      <span>{children}</span>
      {canRemove && (
        <CWIcon iconName="close" className="close-btn" onClick={onRemove} />
      )}
    </button>
  );
};

const CWTagInput = ({
  defaultTags = [],
  tagSuggestions = [],
  onInputChange = () => null,
  canAddCustomTags = true,
  placeholder = '',
  filterMatchingTagSuggestionsOnInputChange = true,
}: TagInputProps) => {
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState(''); // try to avoid setting or using this state
  const [_tags, setTags] = useState(defaultTags);
  const [shouldShowSuggestionsPopover, setShouldShowSuggestionsPopover] =
    useState(false);

  const detectClickAndFocusRealInput = (e) => {
    if (
      e.target === e.currentTarget || // if the mimic'ed input (div container) was clicked
      e.target === inputRef.current // if the real input was clicked
    ) {
      inputRef.current.focus();
    }
  };

  const addTag = (tag) => {
    setTags([..._tags, tag]);
  };

  const addCurrentInputAsTag = () => {
    addTag(inputRef.current.value.trim());
    inputRef.current.value = '';
  };

  const removeTagIndex = (index) => {
    const updatedTags = [..._tags];
    updatedTags.splice(index, 1);
    setTags([...updatedTags]);
  };

  const detectEnter = (e) => {
    // if enter was pressed, an we allow to add custom tags
    if (e.keyCode === 13 && canAddCustomTags) addCurrentInputAsTag();
  };

  const detectBackspace = (e) => {
    // if backspace was pressed, and text input is empty, remove the last tag if any
    if (e.keyCode === 8 && inputRef.current.value === '' && _tags.length > 0)
      removeTagIndex(_tags.length - 1);
  };

  const detectEscape = (e) => {
    // if escape was pressed, then blur the main container
    if (e.keyCode === 27) e.target.blur();
  };

  const showSuggestions = () => {
    setShouldShowSuggestionsPopover(true);
  };

  const hideSuggestions = (e) => {
    // if the new target exists outside out tag input container then hide the suggestions box
    if (!e.relatedTarget) setShouldShowSuggestionsPopover(false);
  };

  const addSuggestion = (suggestion) => {
    // add tag and hide suggestion box
    addTag(suggestion);
    setShouldShowSuggestionsPopover(false);
    inputRef.current.value = '';
  };

  const shouldShowSuggestion = (suggestion) => {
    if (filterMatchingTagSuggestionsOnInputChange) {
      if (
        suggestion
          .trim()
          .toLowerCase()
          .includes(inputValue.trim().toLowerCase())
      ) {
        return true;
      }
      return false;
    }

    return true;
  };

  const handleInputChange = async (e) => {
    await onInputChange(e);

    if (filterMatchingTagSuggestionsOnInputChange) {
      setInputValue(e.target.value.trim());
    }
  };

  const hasSuggestionsToDisplay =
    tagSuggestions.length > 0 &&
    tagSuggestions.filter(shouldShowSuggestion).length > 0;

  return (
    // Main container
    <div
      className="CWTagInputContainer"
      onBlur={hideSuggestions}
      onKeyUp={detectEscape}
    >
      {/* Mimic'ED Input Container */}
      <div className="CWTagInput" onClick={detectClickAndFocusRealInput}>
        {/* Tags */}
        {_tags.map((tag, index) => (
          <Tag key={index} canRemove onRemove={() => removeTagIndex(index)}>
            {tag}
          </Tag>
        ))}

        {/* Real Input */}
        <input
          className="input"
          ref={inputRef}
          placeholder={placeholder}
          onChange={handleInputChange}
          onKeyUp={detectEnter}
          onKeyDown={detectBackspace}
          onFocus={showSuggestions}
        />

        {/* Caret: only show when "has suggestions to display" */}
        {hasSuggestionsToDisplay && (
          <CWIcon
            className="caret-icon"
            iconName={!shouldShowSuggestionsPopover ? 'caretDown' : 'caretUp'}
          />
        )}
      </div>

      {/* Suggestion box */}
      {hasSuggestionsToDisplay && shouldShowSuggestionsPopover && (
        <div className="CWTagSuggestion">
          {tagSuggestions.map(
            (suggestion, index) =>
              shouldShowSuggestion(suggestion) && (
                <button
                  className="suggestion"
                  key={index}
                  onClick={() => addSuggestion(suggestion)}
                >
                  {suggestion}
                </button>
              )
          )}
        </div>
      )}
    </div>
  );
};

export default CWTagInput;
