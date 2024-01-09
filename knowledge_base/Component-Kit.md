Figma is our single source of truth.

The component kit is Engineering’s current implementation of that source of truth. Whenever the Figma version of the kit is updated, changes should be ticketed for Engineering and implemented.

A rendered version of our component kit can be [viewed on the live site](https://commonwealth.im/components), or found in the codebase in the `component_kit` directory.

Components page got revamped and this also means that we will structure the components in a bit more readable way. There are two groups of building blocks in our kit:
- [Foundations](https://www.figma.com/file/yCUKk46hg9Fy3EXGkSoaKT/%F0%9F%9A%A7-Foundation?type=design&node-id=2%3A27&mode=design&t=qnBiTOOKaYhIM9bI-1) - the visual elements needed to create engaging end-to-end user experiences. This includes guidance on iconography, typography, layout and structure.
- [Components](https://www.figma.com/file/eIVp33a1oCu0AtcLwSbGjr/%F0%9F%9A%A7-Components-and-Patterns?type=design&mode=design&t=LQy3p5zpdAM5fos8-1) - reusable building blocks of our design system. Each component meets a specific interaction or UI need, and has been specifically created to work together to create patterns and intuitive user experiences.

### How to add component to components showcase page?
1. Being in `/commonwealth` package, run `yarn add-component-showcase` command
2. Type a name for the new component. Make sure it is aligned with the design team. This name will be used as a file name in the codebase and a display name in component showcase page.
3. Pick if new component should be of type "Foundations" or "Components". This should be aligned with the design team.
4. New file is created in `/ComponentsShowcase/components` directory and `/ComponentsShowcase/componentsList.ts` file is updated.
5. Edit newly created file to add content (display new component).

### Engineering tips
- In generated `{Component}.showcase.tsx` file use React Fragment `<> ... </>` as a wrapper for the whole component. 
- Each generated file comes along with generated CSS class name that is identical as file name. If you want to add styles to specific showcase component, add proper class and styling in `ComponentsSwhocase.scss`.
- There are two main util classes for handling the layout of this page (`flex-column` and `flex-row`). The idea is to minimize customization of styles in this page. Everything should be auto or semi generated.   
## Change Log

- 240109: Authored by Marcin Maslanka.
- 230823: Authored by Graham Johnson.
