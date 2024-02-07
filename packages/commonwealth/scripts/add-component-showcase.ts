import fs from 'fs';
import path from 'path';
import process from 'process';
import readlineSync from 'readline-sync';

const ComponentType = {
  Foundations: 'Foundations',
  Components: 'Components',
};

const PATH = 'client/scripts/views/pages/ComponentsShowcase';

const createComponentShowcaseFile = (displayName: string) => {
  const filePath = path.join(
    process.cwd(),
    `${PATH}/components/${displayName}.showcase.tsx`,
  );

  const reactComponentBoilerplate = `import React from 'react';

const ${displayName}Showcase = () => {
  return <>{/* ${displayName} component goes here */}</>;
};

export default ${displayName}Showcase;
`;

  fs.writeFileSync(filePath, reactComponentBoilerplate);
};

const modifyComponentsListFile = (
  displayName: string,
  componentType: string,
): void => {
  const filePath = path.join(process.cwd(), `${PATH}/componentsList.ts`);
  const fileContent = fs.readFileSync(filePath, 'utf-8');

  // eslint-disable-next-line max-len
  const newImportStatement = `import ${displayName}Showcase from 'views/pages/ComponentsShowcase/components/${displayName}.showcase';\n`;
  const contentWithImport = newImportStatement + fileContent;
  const modifiedContent = contentWithImport
    // Adds type to ComponentPageName
    .replace(
      /export const ComponentPageName = {([^}]+)}/,
      `export const ComponentPageName = {$1  ${displayName}: '${displayName}',\n}`,
    )
    // Add object to componentItems array
    .replace(
      /export const componentItems = \[([^]+)\];/,
      // eslint-disable-next-line max-len
      `export const componentItems = [$1  {\n    ComponentPage: ${displayName}Showcase,\n    displayName: ComponentPageName.${displayName},\n    type: ComponentType.${componentType},\n  },\n];`,
    );

  fs.writeFileSync(filePath, modifiedContent);

  console.log(
    `🚀 Done! '${displayName}' of type '${componentType}' is ready to go!`,
  );
};

const addComponentShowcase = () => {
  const displayName = readlineSync.question(
    '❔ What is the name of the component that will be displayed in the showcase? Use PascalCase name. ',
  );
  const componentTypeInput = readlineSync.question(
    `❔ What is the type of the component? "${ComponentType.Foundations}" or "${ComponentType.Components}"? (F/C) `,
  );

  let componentType: string;
  if (
    componentTypeInput === ComponentType.Foundations ||
    componentTypeInput.toLowerCase() === 'f'
  ) {
    componentType = ComponentType.Foundations;
  } else if (
    componentTypeInput === ComponentType.Components ||
    componentTypeInput.toLowerCase() === 'c'
  ) {
    componentType = ComponentType.Components;
  }

  if (!componentType) {
    console.error(
      `🛑 Invalid component type. Please choose either "${ComponentType.Foundations}" or "${ComponentType.Components}".`,
    );
    process.exit(1);
  }

  console.log(`⏱️ Creating ${displayName} of type ${componentType}...`);

  createComponentShowcaseFile(displayName);
  modifyComponentsListFile(displayName, componentType);
};

try {
  addComponentShowcase();
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
