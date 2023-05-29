import React, { FC } from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { CWCard } from "../../../client/scripts/views/components/component_kit/cw_card";
import { CWText } from "../../../client/scripts/views/components/component_kit/cw_text";

import "../styles/color.scss";

const baseColors: any[] = [
  {"white": "#ffffff"},
  {"black": "#000000"},
];
const neutralColors: any[] = [
  {"neutral-25": "#FBFBFB"},
  {"neutral-50": "#F7F7F7"},
  {"neutral-100": "#F0EFF0"},
  {"neutral-200": "#E0DFE1"},
  {"neutral-300": "#C1C0C2"},
  {"neutral-400": "#A09DA1"},
  {"neutral-500": "#656167"},
  {"neutral-600": "#514E52"},
  {"neutral-700": "#3D3A3E"},
  {"neutral-800": "#282729"},
  {"neutral-900": "#141315"},
];
const primaryColors: any[] = [
  {"primary-25": "#F2F8FF"},
  {"primary-50": "#E5F1FF"},
  {"primary-100": "#CCE3FF"},
  {"primary-200": "#99C7FF"},
  {"primary-300": "#66ABFF"},
  {"primary-400": "#4D9DFF"},
  {"primary-500": "#338FFF"},
  {"primary-600": "#2972CC"},
  {"primary-700": "#1F5699"},
  {"primary-800": "#143966"},
];
const greenColors: any[] = [
  {"green-25": "#F5FBEA"},
  {"green-50": "#EAF6D5"},
  {"green-100": "#D5EDAB"},
  {"green-200": "#C0E481"},
  {"green-300": "#B8E071"},
  {"green-400": "#ABDB58"},
  {"green-500": "#9AC54F"},
  {"green-600": "#7B9E3F"},
  {"green-700": "#5C762F"},
  {"green-800": "#3E4F20"},
];
const yellowColors: any[] = [
  {"yellow-25": "#FFFCF2"},
  {"yellow-50": "#FFF9E5"},
  {"yellow-100": "#FFF2CC"},
  {"yellow-200": "#FFE699"},
  {"yellow-300": "#FFD966"},
  {"yellow-400": "#FFCC33"},
  {"yellow-500": "#FFBF00"},
  {"yellow-600": "#CC9900"},
  {"yellow-700": "#806000"},
  {"yellow-800": "#664C00"},
];
const rorangeColors: any[] = [
  {"rorange-25": "#FFF5F2"},
  {"rorange-50": "#FFEBE5"},
  {"rorange-100": "#FFD8CC"},
  {"rorange-200": "#FFB199"},
  {"rorange-300": "#FF8A66"},
  {"rorange-400": "#FF6333"},
  {"rorange-500": "#FF521D"},
  {"rorange-600": "#D63200"},
  {"rorange-700": "#992400"},
  {"rorange-800": "#721C01"},
];
const pinkColors: any[] = [
  {"pink-25": "#FEF8FD"},
  {"pink-50": "#FDF1FB"},
  {"pink-100": "#FBE4F8"},
  {"pink-200": "#F7C9F2"},
  {"pink-300": "#F4AFEB"},
  {"pink-400": "#F094E5"},
  {"pink-500": "#EC79DE"},
  {"pink-600": "#E263D3"},
  {"pink-700": "#990087"},
  {"pink-800": "#700062"},
];
const purpleColors: any[] = [
  {"purple-25": "#F7F2FF"},
  {"purple-50": "#EFE5FF"},
  {"purple-100": "#DECCFF"},
  {"purple-200": "#BD99FF"},
  {"purple-300": "#9C66FF"},
  {"purple-400": "#7A33FF"},
  {"purple-500": "#4700CC"},
  {"purple-600": "#340095"},
  {"purple-700": "#290075"},
  {"purple-800": "#180044"},
];

const card = {
  title: "Foundations/Color",
  component: CWCard,
} satisfies Meta<typeof CWCard>;

export default card;
type Story = StoryObj<any>;

interface ColorCardProps {
  color: any;
  colorsArr: any[];
}

const variation = (color: string) => {
  return (color === "black" || color ===  "white") ?
   color : color.split("-")[1];
}

const variations = (colorsArr: any[]) => {
  const colors: string[] = [];
  for (let i: number = 0; i < colorsArr.length; i++) {
    colors.push(Object.keys(colorsArr[i])[0])
  }
  return colors;
}

const hex = (colorsArr: any[], color: string) => {
  for (let i: number = 0; i < colorsArr.length; i++) {
    if(colorsArr[i].hasOwnProperty(color)) return colorsArr[i][color];
  }
  return "";
}

const Card: FC<ColorCardProps> = ({ color, colorsArr }) => {
  return (
    <div className="Card">
      <div className={`Swatch ${color}`}>
        <CWText className="font" isCentered>
          AAA 1.75
        </CWText>
      </div>
      <div className="Text">
        <CWText className="variation" fontWeight="bold">
          {variation(color)}
        </CWText>
        <CWText className="hex">
          {hex(colorsArr, color)}
        </CWText>
      </div>
    </div>
  )
}

const BaseStory = (colorsArr: any[]) => {
  return {
    args: { color: Object.keys(colorsArr[0])[0] },
    argTypes: {
      color: {
        control: { type: "radio" },
        options: variations(colorsArr),
      },
    },
    parameters: {
      controls: {
        exclude: [
          "className",
          "elevation",
          "fullWidth",
          "interactive",
          "onClick",
          "onmouseover",
          "onMouseEnter",
          "onMouseLeave",
        ],
      },
    },
    render: ({...args}) => (
      <Card color={args.color} colorsArr={colorsArr} />
    ),
  };
}

export const Base: Story = { ...BaseStory(baseColors) }
export const Neutral: Story = { ...BaseStory(neutralColors) }
export const Primary: Story = { ...BaseStory(primaryColors) }
export const Green: Story = { ...BaseStory(greenColors) }
export const Yellow: Story = { ...BaseStory(yellowColors) }
export const Rorange: Story = { ...BaseStory(rorangeColors) }
export const Pink: Story = { ...BaseStory(pinkColors) }
export const Purple: Story = { ...BaseStory(purpleColors) }
