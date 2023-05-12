import React, { useEffect, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import type { DraggableProvided } from 'react-beautiful-dnd';
import { DragDropContext, Draggable } from 'react-beautiful-dnd';
import { StrictModeDroppable } from 'lib/react-beautiful-dnd';

import type Topic from '../../../models/Topic';
import { CWText } from 'views/components/component_kit/cw_text';
import { CWIcon } from 'views/components/component_kit/cw_icons/cw_icon';

const reorder = (list: Topic[], startIndex, endIndex): Topic[] => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  result.forEach((elm, i) => (elm.order = i + 1));
  return result;
};

// This component handles fixed size of the item in the list
const HeightPreservingItem = ({ children, ...props }) => {
  const [size, setSize] = useState(0);
  const knownSize = props['data-known-size'];

  useEffect(() => {
    setSize((prevSize) => {
      return knownSize == 0 ? prevSize : knownSize;
    });
  }, [knownSize]);

  const style = { '--child-height': `${size}px` } as React.CSSProperties;

  return (
    <div {...props} className="height-preserving-container" style={style}>
      {children}
    </div>
  );
};

interface TopicRowProps {
  provided: DraggableProvided;
  item: Topic;
  isDragging: boolean;
}

const TopicRow = ({ provided, item, isDragging }: TopicRowProps) => {
  return (
    <div
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      ref={provided.innerRef}
      style={{
        ...provided.draggableProps.style,
      }}
      className={`topic-row ${isDragging ? 'is-dragging' : ''}`}
    >
      <CWText>{item.name}</CWText>
      <CWIcon iconName="hamburger" />
    </div>
  );
};

interface DraggableTopicsListProps {
  topics: Topic[];
  setTopics: React.Dispatch<React.SetStateAction<Topic[]>>;
}

const DraggableTopicsList = ({
  topics,
  setTopics,
}: DraggableTopicsListProps) => {
  const onDragEnd = (result) => {
    if (!result.destination) {
      return;
    }

    if (result.source.index === result.destination.index) {
      return;
    }

    setTopics((items) =>
      reorder(items, result.source.index, result.destination.index)
    );
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <StrictModeDroppable
        droppableId="droppable-topics-list"
        mode="virtual"
        renderClone={(provided, snapshot, rubric) => (
          <TopicRow
            provided={provided}
            isDragging={snapshot.isDragging}
            item={topics[rubric.source.index]}
          />
        )}
      >
        {(droppableProvided) => {
          return (
            <Virtuoso
              components={{
                Item: HeightPreservingItem as any,
              }}
              scrollerRef={droppableProvided.innerRef}
              data={topics}
              itemContent={(index, item) => {
                return (
                  <Draggable
                    draggableId={String(item.id)}
                    index={index}
                    key={item.id}
                  >
                    {(draggableProvided) => (
                      <TopicRow
                        provided={draggableProvided}
                        item={item}
                        isDragging={false}
                      />
                    )}
                  </Draggable>
                );
              }}
            />
          );
        }}
      </StrictModeDroppable>
    </DragDropContext>
  );
};

export default DraggableTopicsList;
