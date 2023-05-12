import React, { createContext, useState } from 'react';

type LayoutContextProps = {
  onRerender: () => void;
  renderKey?: string;
};

const initialValues = {
  onRerender: () => {},
  renderKey: '',
};

export const LayoutContext = createContext<LayoutContextProps>(initialValues);

// export const LayoutContextProvider = ({ children }) => {
//   const [renderKey, setRenderKey] = useState('');

//   const onRerender = () => {
//     console.log('onRerender');
//     setRenderKey(Date.now().toString());
//   };

//   console.log('renderKey', renderKey);

//   return (
//     <LayoutContext.Provider value={{ onRerender, renderKey }}>
//       {children}
//     </LayoutContext.Provider>
//   );
// };
