import React from 'react';
import 'components/right_sidebar.scss';

const RightSidebar: React.FC = () => {
  return (
    <div className="RightSidebar">
      <ul className="dummy-rows">
        <li>Dummy Row 1</li>
        <li>Dummy Row 2</li>
        <li>Dummy Row 3</li>
        <li>Dummy Row 4</li>
        <li>Dummy Row 5</li>
      </ul>
    </div>
  );
};

export default RightSidebar;
