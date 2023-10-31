# Debouncing Example

```ts
import React, { useState, useEffect } from 'react';

const Debouncer = () => {
  const [inputValue, setInputValue] = useState('');

  // useEffect hook for debouncing function so it's only created once. 
  useEffect(() => {
    let timerId;
    const handleInputChange = (e) => {
      clearTimeout(timerId);
      timerId = setTimeout(() => {
        setInputValue(e.target.value);
      }, 500); // obvi we need to find the right time value for debouncing. 1/2 sec seems like good place to start. 
    };

    return () => {
      clearTimeout(timerId); // we should clear timer when component unmounts to prevent memory leaks
    };
  }, []);

  return (
    <input onChange={handleInputChange} value={inputValue} />
  );
};

export default Debouncer;
```

## Change Log

- 230209: Updated by, and ownership transferred to, Timothee Legros.
- 230206: Authored by Forest Mars.
