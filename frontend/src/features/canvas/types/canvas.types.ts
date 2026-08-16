export type ElementType = 
|"rectangle"
|"eclipse"
|"line"
|"arrow"
|"text"
|"freedraw"

export interface Point {
    x: number
    y: number
}


export interface BaseElement{
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

    createdAt: number;
    updatedAt: number;
}

export interface RectangleElement extends BaseElement{
    type: "rectangle";
}

export interface EclipseElement extends BaseElement{
    type: "eclipse";
}

export interface LineElement extends BaseElement{
    type: "line";
    points: Point[];
}

export interface ArrowElement extends BaseElement{
    type: "arrow";
    points: Point[];
}

export interface TextElement extends BaseElement{
    type: "text";
    text: string;
    fontSize: number;
    fontFamily: string;
    // textAlign: "left" | "center" | "right";
}

export interface FreeDrawElement extends BaseElement{
    type: "freedraw";
    points: Point[];
}

export type CanvasElement =
    | RectangleElement
    | EclipseElement
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
    | "eclipse"
    | "line"
    | "arrow"
    | "text"
    | "freedraw"
    | "hand";