export type ElementType =
  | "rectangle"
  | "ellipse"
  | "line"
  | "arrow"
  | "text"
  | "freedraw";

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: ElementType;

  x: number;
  y: number;

  width: number;
  height: number;

  rotation: number;

  strokeColor: string;
  backgroundColor: string;

  strokeWidth: number;

  opacity: number;

  createdAt: number;
  updatedAt: number;
}

export interface RectangleElement extends BaseElement {
  type: "rectangle";
}

export interface EllipseElement extends BaseElement {
  type: "ellipse";
}

export interface LineElement extends BaseElement {
  type: "line";
  points: Point[];
}

export interface ArrowElement extends BaseElement {
  type: "arrow";
  points: Point[];
}


export interface TextElement extends BaseElement {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
}

export interface FreeDrawElement extends BaseElement {
  type: "freedraw";
  points: Point[];
}

export type CanvasElement =
  | RectangleElement
  | EllipseElement
  | LineElement
  | ArrowElement
  | TextElement
  | FreeDrawElement;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export type Tool =
  | "select"
  | "rectangle"
  | "ellipse"
  | "line"
  | "arrow"
  | "text"
  | "freedraw"
  | "hand";