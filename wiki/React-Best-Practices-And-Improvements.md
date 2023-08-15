_Certified fresh 230815 by Graham Johnson. All React recommendations originally authored 230502 by Marcin Maslanka._

- ⚠️ This entry intentionally stays silent on state management. See [State Management](./State-Management.md) entry instead.
- ⚠️ This entry is not oriented toward performance improvements. It is concerned with improving developer experience, increasing readability, and aligning our codebase with current React standards.
- ⚠️ This entry discusses aspirational ideals for our codebase, and is not a descriptive documentation of how our codebase is actually organized. Strong divergences between ideal and actual have been explicitly flagged, but few or none of the practices here delineated are consistently or fully implemented.

# Contents

1. [Directory structure](#directory-structure)
    1. [Components](#components)
        - [Skeleton components](#skeleton-components)
        - [Example component directory structure](#example-component-directory-structure)
    2. [Pages](#pages)
2. [Component file composition](#component-file-composition)
    1. [General organization](#general-organization)
    2. [Imports](#imports)
    3. [Props](#props)
    4. [Hooks](#hooks)
    5. [Markup readability](#markup-readability)
    6. [Linting](#linting)
    7. [Example file composition](#example-component-composition)
 

# Directory structure

Currently, our frontend's directory structure is derived from the MVC model, with which React has little in common, and from which we want to gradually move away.

Suggested changes:
- The `commonwealth/client` folder should serve as root for the front-end application. This means that the `scripts` folder should be removed and its content moved to `client`.
- The `styles` folder should contain only global styles, such as `index.scss`, `normalize.css`, or shared styles. Any other style files should neighbor the `.tsx` files where page or component files are defined.
- The `views` folder suggests an MVC architecture. This should be removed, with the main `client` folder housing only two immediate children: `components` and `pages`.

## Components

_Currently housed in `client/script/views/components`; aspirationally housed in `client/components`._

All reusable components (i.e. components that may be invoked multiple times across the app) are kept in the `/components` folder.

Each component is housed in a separate, component-scoped folder named in PascalCase convention. (Currently, this naming convention is unevenly implemented, and many instances of snake_case remain.)
- e.g. `/Button`, `/ProposalCard` etc.

In each folder there should be an `index.ts` file that exports components from that folder. All file imports should go through this index file, rather than importing directly from the component file.
- e.g. `import { AvatarUpload, Avatar} from 'components/Avatar`

Aspirationally, components' respective `.scss` files should be placed next to the components and should be named the same way as the component it belongs to
- e.g. `client/components/Sidebar/Sidebar.scss`

### Skeleton components

Skeleton components should be defined in separate files, in the same directory as their non-skeleton equivalents (e.g. ComponentSkeleton.tsx organized alongside Component.tsx). 

Skeleton components should be returned via a conditional `if` statement, e.g. `if (loading) return <ComponentSkeleton />`.

### Example component directory structure
    
```
- components
  - Button
    - index.ts
    - Button.tsx
    - Button.scss
  - Sidebar
    - index.ts
    - Sidebar.tsx
    - SidebarSkeleton.tsx
    - Sidebar.scss
    - QuickSwitcher
      - index.ts
      - QuickSwitcher.tsx
      - QuickSwitcherSkeleton.tsx
      - QuickSwitcher.scss
```

## Pages

_Currently housed in `client/script/views/pages`; aspirationally housed in `client/pages`._

Aspirationally, components serving as entry points for routes are housed in this directory.

Each folder should demarcate a separate route.
- `snake_case` is not an appropriate naming convention for folders. We should change it to  either `PascalCase` or `kebab-case`.

The central component of a given route-scoped folder should not be defined in `index.ts`, but rather in a separate file (e.g. `Component.tsx`). The `index.ts` file should instead be reserved for exporting any components in its parent folder

As in the `/components` folder, all stylesheets (`.scss` files) should housed be in the same folder as `.tsx` page files.

# Component file composition

This section looks at best practices for how to organize the code within a component file.

### General organization

- The component name should be identical to the file name.
- Files should not house more than a single component.

### Imports

We should move towards configuring our eslint library to perform automatic import sorting. There are many plugins that would make our job easier; see [here](https://levelup.gitconnected.com/how-to-sort-imports-in-react-project-550f5ce70cbf).

### Props

Each component should define a props interface immediately above the component definition. 

This interface should take the naming structure `ComponentProps`, e.g. `AvatarUploadProps`.

Props should be immediately destructured within the Component's definition.

### Hooks

In general, hooks and utils should be kept close to the component. If a hook or util function begins to be used by multiple pages or components, it should be moved to our `/utils` and `/helpers` directories.

Ideally, we should extract business logic to custom hooks that are responsible for fetching, storing and manipulating data. This way, we follow single responsibility rule.

React hooks should be housed either top of the component and should follow [React hooks rules](https://legacy.reactjs.org/docs/hooks-rules.html).

We currently overuse `// eslint-disable-next-line react-hooks/exhaustive-deps`. Passing exact dependencies as eslint suggests makes sense in the vast majority of situations; if your dependency array causes an infinite loop, it means that either the logic is poorly designed, or the dependency needs to be wrapped in `useMemo`/`useCallback`.

We should favour using `useState` or `useEffect` instead of `React.useState` or `React.useEffect`. The same goes for other methods imported from the React packages.

### Markup readability

Components should be kept as concise and readable as possible. If the component requires more complex logic, this logic should be moved to util functions in a separate file.

We should place as little logic as possible in the component's `return`, as this area houses the markup/UI of the component and should be optimized for readability. 
  - E.g., all calculations should be made in the component body prior to the `return`; there result can be assigned to const for later reference.
  
The same is true for event handler definitions, like `onClick`. Define the handler functions in the component body and reference them in the `return`.

### Linting

Pre-commit, we should run `yarn format`, which runs the `prettier` library to ensure our code is well-formatted.

Down the line we [may want to invole the Husky library in this process](https://prettier.io/docs/en/precommit.html).

### Example component composition

An example of a simple component, child component, and custom hook.**

```tsx
// file Component.tsx

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
// file Item.tsx

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

```ts
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