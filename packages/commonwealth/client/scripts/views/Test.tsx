import React from 'react';
import { ScrollContainer } from 'views/components/ScrollContainer/ScrollContainer';

export const Test = () => {
  return (
    <div>
      <ScrollContainer>
        <div style={{ display: 'flex' }}>
          <div>Child1</div>
          <div>Child2</div>
          <div>Child3</div>
          <div>Child4</div>
          <div>Child5</div>
          <div>Child6</div>
          <div>Child7</div>
          <div>Child8</div>
          <div>Child9</div>
        </div>
      </ScrollContainer>
    </div>
  );
};
