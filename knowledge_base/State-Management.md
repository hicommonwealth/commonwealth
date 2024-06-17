# State Management

## Contents

- [Overview](#overview)
- [Introduction](#introduction)
- [Why two different state management tools?](#why-two-different-state-management-tools)
- [Zustand](#zustand)
  * [Directory structure](#directory-structure)
  * [Store file composition](#store-file-composition)
  * [Middlewares](#middlewares)
  * [Testing](#testing)
  * [Usage](#usage)
- [Change Log]

## Overview

This document is intended to provide the fundamental principles for creating the next parts of the store using best practices.

## Introduction

At the moment, the state management we have is from the time when we used Mithril as a UI library. It is not properly adjusted to our new UI library - React. As a consequence, we have decided that we will gradually introduce two solutions for the new state management, namely Zustand and React-Query. The goal is to rewrite the current state until it is completely dropped, which could take weeks or months.

## Why two different state management tools?

Zustand and React Query serve different purposes and excel in different areas. Zustand is a lightweight state management library that focuses on managing local state within a component or a small portion of the application. It provides a simple and intuitive API for managing state without the need for a global store. On the other hand, React Query is a powerful data fetching library that handles remote data fetching, caching, and synchronization with minimal boilerplate. It means that Zustand and React Query can help separate concerns in our application. Zustand can handle UI-related state concerns such as form inputs, sidebars, modals, and local component state. React Query, on the other hand, can focus on handling API requests, caching responses, and managing the global data state. This separation can lead to cleaner and more maintainable code, as each library is responsible for its specific domain.

## Zustand

We should use Zustand for things that are related to the UI and that have nothing to do with the API. A good example of this is the sidebar, which can be visible or hidden and in addition can have different content. All this logic is temporary, client-only, not stored in any way on the backend.

*Please take a look at #3893 to see the examples of below practices.*

### Directory structure

- There is a `state` folder that divides state for `ui` and `api`. In `ui` we keep Zustand files, while `api` is for React-Query.
- Unlike the old state, we will be creating several small stores instead of one big store.
- Each store should be placed in separate directory. Inside this directory there should be a file with the store itself and the `index.ts` file which groups exports.

### Store file composition

- Each store file should contain `interface` for the shape of store.
- We should create a store using `createStore` method (vanilla store).
- Then we should wrap the store with `createBoundedUseStore` (react-hook store).
- Vanilla store is necessary if we want to modify the store outside of the react context. Also, it is necessary for unit testing.
- React-hook is our default way - this store is necessary for interacting from react components.
- We should use named export for vanilla store and default export for react-hook store.

### Middlewares

- Zustand is flexible here so each store can be enhanced with number of middlewares independently.
- Our default middleware should be `devtools`. Thanks to this middleware, we are able to use [browser extension](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en) to debug the store (yes, redux devtools).
- Other middleware that might be handy is [immer](https://docs.pmnd.rs/zustand/integrations/immer-middleware) that will help write non-mutable code in mutable manner. It helps especially when the state has big number of nesting levels.
- Another middleware that is worth mentioning is [persist](https://docs.pmnd.rs/zustand/integrations/persisting-store-data). This might be helpful if we would like to keep data unchanged between window refreshes.
- The principle of each middleware is the same. Wrap the entire store in a middleware function and everything should work out of the box.

### Testing

- We should start testing all the stores we create. Unit tests should be very simple to write, because they consist of checking the initial state, calling a mutation, and asserting if the state has changed.
- In these tests, we do not check the UI. We only check the logic of the reducer/mutation functions.
- The test files should be located in the `test/unit/state` directory and each test file should be named after a piece of the corresponding store.
- In the tests, we use vanilla store instead of react-hook store. This way we don't need to import additional react related libraries that allow calling hooks.

### Usage

- In react components, we import react-hook store and then use destructuring to access getters and setters.

```ts
import useSidebarStore from 'state/ui/sidebar';

const { setMenu, menuName, menuVisible } = useSidebarStore();
```

- Outside of react components (controllers, tests etc.), we import vanilla store and then using `getState()` we access store's getters and setters.

```ts
import { sidebarStore } from 'state/ui/sidebar';

// getter
const isVisible = sidebarStore.getState().menuVisible;

// setter
sidebarStore
    .getState()
    .setMenu({ name: 'exploreCommunities', isVisible: true });
```

*IMPORTANT: Do not use `sidebarStore.setState()` for mutating the state. Always define setter in the store and mutate that state only using this setter.*

## Change Log

- 23XXXX: Authored by Marcin Maslanka.
