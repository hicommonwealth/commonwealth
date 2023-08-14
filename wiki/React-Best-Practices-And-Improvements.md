
- ⚠️ This file intentionally does not say anything about the state management as this is a different story


- ⚠️ Most of these things are not related to performance improvements. It is mostly about improving developer experience and making project more readable, aligned with current React standards.



# Directory structure

Currently: 

The structure is derived from the MVC model with which React has little in common and from which we want to gradually move away.

Suggestions for change:

- The `commonwealth/client` folder should be the root for the front-end application. This means that the `scripts` folder should be removed and its content moved to `client`.
- The `styles` folder should contain only global styles, such as `index.scss`, `normalize.css`, or shared styles. Any other style files should be close to the files where page or component files are defined.
- The `views` folder suggests an MVC architecture. In my opinion, we should remove it and in the main `client` folder we should have only two folders: `components` and `pages`.

## Components

- in there we keep all components that are reusable, that apply to more than one place in the application.
- each component is a separate folder, which should have its name in PascalCase convention, e.g. `Button`, `ProposalCard` etc.
- in each folder there should be an `index.ts` file that exports components from that folder. Then we avoid the `components/Button/Button` situation in the file import.
- when there is more than one file with components in a folder, we should create a new folder
- the `scss` files should be close next to the components and should be named the same way as the component it belongs to e.g.
    
    ```jsx
    - components
    	- Button
    		- index.ts
    		- Button.tsx
    		- Button.scss
    	- Sidebar
    		- index.ts
    		- Sidebar.tsx
    		- Sidebar.scss
    		- QuickSwitcher
    			- index.ts
    			- QuickSwitcher.tsx
    			- QuickSwitcher.scss
    ```
    

## Pages

- in there we keep components, which are entry points for routes
- each folder should be a separate route
- `snake_case` is not an appropriate convention for folder names. We should change it either to `PascalCase` or to `kebab-case`.
- the main component should not be defined in `index.ts` but in a separate file. The `index.ts` file is the one that exports the components from this folder
- similar as in `components`, the `scss` files should be in the same folder as the page file

## Other considerations

- It is important to keep the function, util, hook, or whatever else close to where it is used. When it starts to be used by more components/pages, move it to a global place for helpers, or hooks.

# Component File Composition

- It would be great if we configured eslint for automatic import sorting. There are many plugins that would make our job easier - [link](https://levelup.gitconnected.com/how-to-sort-imports-in-react-project-550f5ce70cbf)
- Component name should be the same as the file name
- Each component should have interface for props defined which is right above the component definition. Props should be destructured right away.
- React hooks should be on top of the component and should follow the [hooks rules](https://legacy.reactjs.org/docs/hooks-rules.html)
- We definitely overuse `// eslint-disable-next-line react-hooks/exhaustive-deps` . Passing exact dependencies as eslint suggest really make sense in 99% of situations. If your dependency array causes an infinite loop, it means that either the logic is poorly designed, or the dependency needs to be wrapped in useMemo/useCallback .
- We should favour using `useState` or `useEffect` instead of `React.useState` or `React.useEffect`. The same goes for other methods imported from the React package
- We should keep the component as small and as readable as possible. In case the component requires more complex logic, it's a good idea to move this to util functions in another file.
- Ideally, we should extract business logic to custom hook, that will be responsible for fetching, storing and manipulating data. This way, we follow single responsibility rule.
- We should not have two components in single file. It is better to create new component in new file.
- in `return` we should keep as little logic as possible as this supposed to be markup/UI of the component. Thus, all calculations should be made in the component body, assigned to const and used in return.
- Likewise when it comes to function handlers. We shouldn't write logic where we should keep markup. Let's define handler functions in component body and use them with onClick, onChange, etc.

**Example of simple component, child component and custom hook.**

```tsx
// file Component.ts

interface ComponentProps = {
  title: string;
  id: number;
}

const Component = ({ title, id }: ComponentProps) => {
  const { items, loadItems } = useComponent();

  const handleClick = () => {
    loadItems();
    // more logic
  };

  return (
    <div>
      <button onClick={handleClick}>Click</button>
      {items.map((item) => (
        <Item key={item.id} title={item.title} id={item.id} />
      ))}
    </div>
  );
};

export default Component
```

```tsx
// file Item.ts

const Item = ({ title, id }: Interface) => {
  return (
    <div>
      <h1>{title}</h1>
      <p>{id}</p>
    </div>
  );
};

export default Item
```

```tsx
// file useComponent.ts

const useComponent = () => {
  const [items, setItems] = useState([]);

  const loadItems = async () => {
    const response = await axios('url');
    setItems(response.data);
  };

  return { loadItems, items };
};

export default useComponent
```

# Other things

- we should use `prettier` on pre commit using `husky` to make sure that our code is well formatted all the time [https://prettier.io/docs/en/precommit.html](https://prettier.io/docs/en/precommit.html)