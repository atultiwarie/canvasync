import type {
    Camera,
    CanvasElement,
} from "../types/canvas.types"

import {worldToScreen} from "./coordinates"

export const clearCanvas = (ctx: CanvasRenderingContext2D,canvas: HTMLCanvasElement) : void => {
    ctx.clearRect(
        0,
        0, 
        canvas.width, 
        canvas.height);
}

export const renderElements = (
  ctx: CanvasRenderingContext2D,
  elements: CanvasElement[],
  camera: Camera,
  draftElement?: CanvasElement | null,
): void => {
  for (const element of elements) {
    renderElement(ctx, element, camera);
  }

  if (draftElement) {
    renderElement(ctx, draftElement, camera);
  }
};

export const renderElement = (ctx: CanvasRenderingContext2D, element: CanvasElement, camera: Camera) : void => {
    switch (element.type) {
        case "rectangle":
            renderRectangle(ctx,element,camera)
            break;
        case "eclipse":
            renderEclipse(ctx,element,camera)
            break;
        case "line":
            renderLine(ctx,element,camera)
            break;
        case "arrow":
            renderArrow(ctx,element,camera)
            break;
        case "text":
            renderText(ctx,element,camera)
            break;
        case "freedraw":
            renderFreeDraw(ctx,element,camera)
            break;
    }
}

const renderRectangle = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  camera: Camera,
): void => {
    const position = worldToScreen(
        {
            x: element.x,
            y: element.y
        },camera
    )
    ctx.save()

    ctx.strokeStyle = element.strokeColor
    ctx.lineWidth = element.strokeWidth* camera.zoom
    ctx.fillStyle = element.backgroundColor;

    ctx.fillRect(
      position.x,
      position.y,
      element.width * camera.zoom,
      element.height * camera.zoom,
    );
    ctx.strokeRect(
        position.x,
        position.y,
        element.width * camera.zoom,
        element.height * camera.zoom
    )
    ctx.restore()


};


const renderEclipse = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  camera: Camera,
): void => {
    const position = worldToScreen(
        {
            x: element.x,
            y: element.y
        },camera
    )
   const centerX = position.x + (element.width * camera.zoom) / 2;
   const centerY = position.y + (element.height * camera.zoom) / 2;
   const radiusX = (element.width * camera.zoom) / 2;
   const radiusY = (element.height * camera.zoom) / 2;
   ctx.save();

    ctx.strokeStyle = element.strokeColor;
    ctx.lineWidth = element.strokeWidth * camera.zoom;
    ctx.beginPath();

    ctx.ellipse(
        centerX,
        centerY,
        radiusX,
        radiusY,
        0,
        0,
        2 * Math.PI
    )
    ctx.stroke();
    ctx.restore();

};


const renderLine = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  camera: Camera,
): void => {
    if (!('points' in element) || element.points.length < 2) {
        return;
    }

    ctx.save();

    ctx.strokeStyle = element.strokeColor;
    ctx.lineWidth = element.strokeWidth * camera.zoom;
    ctx.beginPath();

    const firstPoint = worldToScreen(
        element.points[0],
        camera
    );

    ctx.moveTo(
        firstPoint.x,
        firstPoint.y
    );

    for (const point of element.points.slice(1)) {
        const screenPoint = worldToScreen(
            point,
            camera
        );
        ctx.lineTo(
            screenPoint.x,
            screenPoint.y
        );
    }

    ctx.stroke();
    ctx.restore();
};


const renderArrow = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  camera: Camera,
): void => {
    renderLine(ctx, element, camera);
};


const renderText = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  camera: Camera,
): void => {
    if (!('fontSize' in element) || !('fontFamily' in element) || !('text' in element)) {
        return;
    }

    const position = worldToScreen(
        {
            x: element.x,
            y: element.y
        },
        camera
    );

    ctx.save();
    ctx.fillStyle = element.strokeColor;
    ctx.font = `${element.fontSize * camera.zoom}px ${element.fontFamily}`;
    ctx.fillText(element.text, position.x, position.y);
    ctx.restore();
};

const renderFreeDraw = (
  ctx: CanvasRenderingContext2D,
  element: CanvasElement,
  camera: Camera,
): void => {
    if (!('points' in element) || element.points.length < 2) {
        return;
    }

    ctx.save();
    ctx.strokeStyle = element.strokeColor;
    ctx.lineWidth = element.strokeWidth * camera.zoom;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();

    const firstPoint = worldToScreen(
        element.points[0],
        camera
    );

    ctx.moveTo(
        firstPoint.x,
        firstPoint.y
    );

    for (const point of element.points.slice(1)) {
        const screenPoint = worldToScreen(
            point,
            camera
        );
        ctx.lineTo(
            screenPoint.x,
            screenPoint.y
        );
    }

    ctx.stroke();
    ctx.restore();
};
