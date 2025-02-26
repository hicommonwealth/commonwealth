import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { components } from 'react-select';
import { CWIcon } from '../../../component_kit/cw_icons/cw_icon';
import { ComponentType } from '../../types';
import { CWSelectList } from '../CWSelectList/CWSelectList';
import './UpwardMultiSelectList.scss';

export type MultiSelectOption = {
  value: string;
  label: string;
  description?: string;
  pricing?: {
    prompt: number;
    completion: number;
  };
};

type UpwardMultiSelectListProps = {
  options: MultiSelectOption[];
  defaultValue?: MultiSelectOption;
  placeholder: string;
  isDisabled?: boolean;
  onChange?: (options: MultiSelectOption[]) => void;
  value?: MultiSelectOption[];
  maxDisplayCount?: number; // Maximum number of displayed items before showing "+X more"
  menuPlacement?: 'top' | 'bottom' | 'auto';
};

// Create custom components for handling multi-value display
const createCustomComponents = (
  containerWidth: number,
  value: MultiSelectOption[] = [],
) => {
  // Smaller estimate for item width to allow more to fit
  const avgItemWidth = 80; // pixels - reduced to fit more items
  // Add some buffer space for padding, borders, etc.
  const containerBuffer = 30; // pixels - reduced buffer
  // Estimate how many items can fit in container
  const estimatedVisibleCount = Math.max(
    1,
    Math.floor((containerWidth - containerBuffer) / avgItemWidth),
  );

  // Custom Option component that shows a checkmark for selected options
  const CustomOption = (props: any) => {
    // Determine if this option is selected by checking if it's in the value array
    const isSelected = value.some((item) => item.value === props.data.value);

    return (
      <components.Option {...props}>
        <div className="upward-option-container">
          <div className="upward-option-content">
            <div className="upward-option-label">{props.label}</div>
            {props.data.description && (
              <div className="upward-option-description">
                {props.data.description}
              </div>
            )}
          </div>
          {isSelected && <CWIcon iconName="check" iconSize="small" />}
        </div>
      </components.Option>
    );
  };

  // Custom MultiValueContainer to show compact list of selected items
  const CustomMultiValueContainer = ({
    children,
    getValue,
    data,
    ...props
  }: any) => {
    const allValues = getValue() || [];
    const currentValueIndex = allValues.findIndex(
      (v: any) => v.value === data.value,
    );

    // Determine if we should use compact view based on container width and number of selected items
    const useCompactView = allValues.length > estimatedVisibleCount;

    // Show first item in compact view or show all items in normal view
    if (useCompactView) {
      // Only render the first item
      if (currentValueIndex === 0) {
        return (
          <components.MultiValueContainer {...props}>
            {children}
          </components.MultiValueContainer>
        );
      }

      // For the second position, show "+X more"
      if (currentValueIndex === 1) {
        return (
          <components.MultiValueContainer
            {...props}
            className="upward-more-container"
          >
            <div className="upward-more-label">
              +{allValues.length - 1} more
            </div>
          </components.MultiValueContainer>
        );
      }

      // Don't render other items
      return null;
    }

    // In normal view, just render all items
    return (
      <components.MultiValueContainer {...props}>
        {children}
      </components.MultiValueContainer>
    );
  };

  // Custom Menu component to ensure the list is scrolled to the top when opened
  const CustomMenu = (props: any) => {
    useEffect(() => {
      // When the menu mounts, scroll to the top
      if (
        props.selectProps.menuListRef &&
        props.selectProps.menuListRef.current
      ) {
        props.selectProps.menuListRef.current.scrollTop = 0;

        // Set a CSS variable for the height of the selected section
        // Used for the background gradient
        const selectedCount = value.length;
        if (selectedCount > 0) {
          // Calculate approximate height - each option is about 40px tall plus padding
          const selectedHeight = selectedCount * 40 + 16; // Option height + some padding
          props.selectProps.menuListRef.current.style.setProperty(
            '--selected-height',
            `${selectedHeight}px`,
          );
        } else {
          props.selectProps.menuListRef.current.style.setProperty(
            '--selected-height',
            '0px',
          );
        }
      }
    }, [props.selectProps.menuListRef, value.length]);

    return <components.Menu {...props} />;
  };

  return {
    Option: CustomOption,
    MultiValueContainer: CustomMultiValueContainer,
    Menu: CustomMenu,
  };
};

export const UpwardMultiSelectList = ({
  options,
  defaultValue,
  placeholder,
  isDisabled = false,
  onChange,
  value = [],
  maxDisplayCount = 1,
  menuPlacement = 'top', // Default to opening upward
}: UpwardMultiSelectListProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Sort options to place selected items at the top of the list
  const availableOptions = useMemo(() => {
    if (!options || options.length === 0) return [];

    // Create a set of selected values for faster lookup
    const selectedValues = new Set(value.map((v) => v.value));

    // Get selected and non-selected options
    const selectedOptions = options
      .filter((opt) => selectedValues.has(opt.value))
      .sort((a, b) => a.label.localeCompare(b.label));

    const nonSelectedOptions = options
      .filter((opt) => !selectedValues.has(opt.value))
      .sort((a, b) => a.label.localeCompare(b.label));

    // If we have both selected and non-selected options, add a divider
    if (selectedOptions.length > 0 && nonSelectedOptions.length > 0) {
      return [
        ...selectedOptions,
        // Add a divider option
        {
          value: 'divider',
          label: '───────────────',
          description: '',
          isDisabled: true,
        } as MultiSelectOption,
        ...nonSelectedOptions,
      ];
    }

    // If all or none are selected, just return the sorted list
    return [...selectedOptions, ...nonSelectedOptions];
  }, [options, value]);

  const handleChange = useCallback(
    (newValue: any) => {
      if (Array.isArray(newValue)) {
        onChange?.(newValue);
      }
    },
    [onChange],
  );

  // More aggressive width measurement
  const updateWidth = useCallback(() => {
    if (containerRef.current) {
      const { offsetWidth } = containerRef.current;
      // Force a re-calculation of the width by accessing offsetWidth
      // This helps ensure the browser has properly rendered the component
      containerRef.current.getBoundingClientRect();

      if (offsetWidth > 0 && offsetWidth !== containerWidth) {
        setContainerWidth(offsetWidth);
      }
    }
  }, [containerWidth]);

  // Measure container width on mount and when window resizes
  useEffect(() => {
    // Initial measurement - use a short delay to ensure DOM is ready
    const initialTimer = setTimeout(updateWidth, 50);

    // Second measurement after a longer delay
    const secondTimer = setTimeout(updateWidth, 300);

    // Add resize listener
    window.addEventListener('resize', updateWidth);

    // Setup a mutation observer to detect DOM changes that might affect width
    const observer = new MutationObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current.parentElement || document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'width'],
      });

      // Also observe the component itself for changes
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'width'],
      });
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', updateWidth);
      observer.disconnect();
      clearTimeout(initialTimer);
      clearTimeout(secondTimer);
    };
  }, [updateWidth]);

  // Force additional updates when value or options change
  useEffect(() => {
    const timer = setTimeout(updateWidth, 100);
    return () => clearTimeout(timer);
  }, [value, options, updateWidth]);

  // Create custom components based on container width
  const customComponents = useMemo(
    () => createCustomComponents(containerWidth, value),
    [containerWidth, value],
  );

  return (
    <div
      ref={containerRef}
      className={ComponentType.TypeaheadSelectList + ' UpwardMultiSelectList'}
      data-selected={value?.length || 0}
      style={{ width: '100%' }}
    >
      <CWSelectList
        options={availableOptions}
        defaultValue={defaultValue}
        value={value}
        isSearchable={true}
        isClearable={false}
        classNamePrefix="umsl"
        placeholder={placeholder}
        noOptionsMessage={() => 'No matches found.'}
        isDisabled={isDisabled}
        onChange={handleChange}
        isMulti={true}
        menuPlacement={menuPlacement}
        components={customComponents}
        hideSelectedOptions={false}
        closeMenuOnSelect={false}
      />
    </div>
  );
};
