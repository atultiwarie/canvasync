/**
 * export.utils.ts — Phase 5: Export as JSON, PNG, SVG
 *
 * KEY CONCEPT: The renderer always draws in "screen space" — everything
 * is transformed by the camera (pan + zoom). For export we need to
 * work in "world space" so the output is independent of the current viewport.
 *
 * APPROACH:
 *  - JSON: trivial — just serialize elements[]
 *  - PNG:  create a fake "export camera" that frames all elements perfectly,
 *          render onto an offscreen <canvas> at 2× pixel density, download
 *  - SVG:  convert each element to SVG primitives using world coordinates
 *          (no camera transform needed at all)
 */

import { renderElements } from "../engine/renderer";
import type { Camera, CanvasElement, Point } from "../types/canvas.types";

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** Trigger a file download from an in-memory string or data URL */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Trigger a download from a data-URL (used for PNG canvas export) */
function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Compute the bounding box that covers every element.
 *
 * WHY: Elements live in "world coordinates" (e.g. x:200, y:150, w:100, h:80).
 * We need to know the min/max extents so we can size the export canvas or SVG.
 *
 * For line/arrow/freedraw we look at individual points.
 * For everything else we use x, y, width, height.
 */
function getBoundingBox(elements: CanvasElement[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const el of elements) {
    // Elements with explicit points (line, arrow, freedraw)
    if ("points" in el && el.points.length > 0) {
      for (const p of el.points as Point[]) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
    } else {
      // Shape / text elements: use bounding rect
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    }
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// ─── 5.1  Export JSON ─────────────────────────────────────────────────────────

/**
 * Serializes the current elements array to a .canvassync.json file.
 *
 * The file format includes a version number so future imports can handle
 * backwards-compatibility if the schema ever changes.
 */
export function exportJSON(elements: CanvasElement[], boardTitle = "board") {
  const data = {
    version: 1,
    title: boardTitle,
    exportedAt: new Date().toISOString(),
    elements,
  };

  downloadFile(
    JSON.stringify(data, null, 2),
    `${boardTitle.replace(/\s+/g, "_")}.canvassync.json`,
    "application/json",
  );
}

/**
 * Import JSON — parses the file, validates it has an elements array,
 * then calls the provided callback with the parsed elements.
 *
 * We return a Promise so the caller can await it and show a loading state.
 */
export function importJSON(
  file: File,
): Promise<{ elements: CanvasElement[]; title?: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string);

        // Basic schema validation
        if (!raw || !Array.isArray(raw.elements)) {
          throw new Error("Invalid CanvasSync file — missing elements array.");
        }

        resolve({
          elements: raw.elements as CanvasElement[],
          title: raw.title,
        });
      } catch (err) {
        reject(err instanceof Error ? err : new Error("Failed to parse file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// ─── 5.2  Export PNG ─────────────────────────────────────────────────────────

/**
 * Exports the board as a high-quality PNG.
 *
 * HOW IT WORKS:
 *
 *  1. Compute the bounding box of all elements in world space.
 *  2. Add padding around the content (so nothing is flush against the edge).
 *  3. Build a "export camera":
 *       - camera.x / camera.y are set so the top-left of the bounding box
 *         maps to (padding, padding) on the output canvas.
 *       - camera.zoom = SCALE (we render at 2× for retina quality).
 *  4. Create an offscreen <canvas> sized to fit.
 *  5. Draw a white background, then call renderElements (the same function
 *     the live canvas uses!) with our fake camera.
 *  6. Convert to PNG data URL → download.
 *
 * The magic: renderElements(ctx, elements, camera) — by changing the camera
 * we can tell the renderer "pretend the viewport is positioned here, at this
 * zoom" without touching any live state.
 */
export function exportPNG(elements: CanvasElement[], boardTitle = "board") {
  if (elements.length === 0) {
    alert("Nothing to export — add some elements first.");
    return;
  }

  const PADDING = 40; // px of whitespace around content
  const SCALE = 2; // 2× = retina / high-DPI quality

  const box = getBoundingBox(elements);

  // Canvas pixel dimensions
  const canvasW = (box.width + PADDING * 2) * SCALE;
  const canvasH = (box.height + PADDING * 2) * SCALE;

  const exportCamera: Camera = {
    x: box.minX - PADDING,
    y: box.minY - PADDING,
    zoom: SCALE,
  };

  const offscreen = document.createElement("canvas");
  offscreen.width = canvasW;
  offscreen.height = canvasH;

  const ctx = offscreen.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasW, canvasH);

  renderElements(ctx, elements, exportCamera);

  const dataUrl = offscreen.toDataURL("image/png");
  downloadDataUrl(dataUrl, `${boardTitle.replace(/\s+/g, "_")}.png`);
}

export function generateBoardPngBase64(
  elements: CanvasElement[],
): string | null {
  if (elements.length === 0) return null;

  const PADDING = 40;
  const SCALE = 1.5; // Slightly smaller than export to keep API payload lean

  const box = getBoundingBox(elements);

  const canvasW = (box.width + PADDING * 2) * SCALE;
  const canvasH = (box.height + PADDING * 2) * SCALE;

  const exportCamera: Camera = {
    x: box.minX - PADDING,
    y: box.minY - PADDING,
    zoom: SCALE,
  };

  const offscreen = document.createElement("canvas");
  offscreen.width = canvasW;
  offscreen.height = canvasH;

  const ctx = offscreen.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvasW, canvasH);

  renderElements(ctx, elements, exportCamera);

  return offscreen.toDataURL("image/png");
}

// ─── 5.3  Export SVG ─────────────────────────────────────────────────────────

/**
 * Exports the board as an SVG file.
 *
 * WHY SVG IS DIFFERENT FROM PNG:
 *   PNG is pixels — SVG is a description of shapes in XML.
 *   SVG is infinitely scalable and can be opened in Figma, Illustrator, etc.
 *
 * KEY: We use WORLD COORDINATES directly as SVG coordinates.
 * There's no "camera transform" needed — SVG has its own viewBox attribute
 * that acts like a viewport. We set viewBox to the bounding box of all elements.
 *
 * Each element type maps to an SVG primitive:
 *   rectangle  → <rect>
 *   ellipse    → <ellipse>
 *   line       → <polyline>
 *   arrow      → <polyline> + <polygon> for arrowhead
 *   freedraw   → <path> with quadratic bezier curves (matches canvas renderer)
 *   text       → <text>
 */
export function exportSVG(elements: CanvasElement[], boardTitle = "board") {
  if (elements.length === 0) {
    alert("Nothing to export — add some elements first.");
    return;
  }

  const PADDING = 40;
  const box = getBoundingBox(elements);

  const vbX = box.minX - PADDING;
  const vbY = box.minY - PADDING;
  const vbW = box.width + PADDING * 2;
  const vbH = box.height + PADDING * 2;

  // Build SVG elements as strings
  const svgParts: string[] = [];

  for (const el of elements) {
    const opacity = el.opacity ?? 1;
    const stroke = el.strokeColor;
    const fill =
      el.backgroundColor === "transparent" ? "none" : el.backgroundColor;
    const sw = el.strokeWidth;
    const rotate = el.rotation
      ? ` transform="rotate(${(el.rotation * 180) / Math.PI} ${el.x + el.width / 2} ${el.y + el.height / 2})"`
      : "";

    switch (el.type) {
      case "rectangle":
        svgParts.push(
          `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" ` +
            `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"${rotate}/>`,
        );
        break;

      case "ellipse": {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const rx = el.width / 2;
        const ry = el.height / 2;
        svgParts.push(
          `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ` +
            `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"${rotate}/>`,
        );
        break;
      }

      case "line":
      case "freedraw": {
        if (el.points.length < 2) break;
        const pts = el.points.map((p) => `${p.x},${p.y}`).join(" ");
        svgParts.push(
          `<polyline points="${pts}" fill="none" stroke="${stroke}" ` +
            `stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`,
        );
        break;
      }

      case "arrow": {
        if (el.points.length < 2) break;
        const pts = el.points.map((p) => `${p.x},${p.y}`).join(" ");
        const start = el.points[0];
        const end = el.points[el.points.length - 1];
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const arrowLen = 12;
        const arrowAngle = Math.PI / 7;
        // Arrowhead triangle points
        const ax1 = end.x - arrowLen * Math.cos(angle - arrowAngle);
        const ay1 = end.y - arrowLen * Math.sin(angle - arrowAngle);
        const ax2 = end.x - arrowLen * Math.cos(angle + arrowAngle);
        const ay2 = end.y - arrowLen * Math.sin(angle + arrowAngle);
        svgParts.push(
          `<polyline points="${pts}" fill="none" stroke="${stroke}" ` +
            `stroke-width="${sw}" stroke-linecap="round" opacity="${opacity}"/>` +
            `<polygon points="${end.x},${end.y} ${ax1},${ay1} ${ax2},${ay2}" ` +
            `fill="${stroke}" stroke="${stroke}" stroke-width="${sw * 0.5}" opacity="${opacity}"/>`,
        );
        break;
      }

      case "text":
        svgParts.push(
          `<text x="${el.x}" y="${el.y}" font-size="${el.fontSize}" ` +
            `font-family="${el.fontFamily}" fill="${stroke}" ` +
            `dominant-baseline="text-before-edge" opacity="${opacity}"${rotate}>${escapeXml(el.text)}</text>`,
        );
        break;
    }
  }

  const svgContent = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbX} ${vbY} ${vbW} ${vbH}" ` +
      `width="${vbW}" height="${vbH}">`,
    `  <rect x="${vbX}" y="${vbY}" width="${vbW}" height="${vbH}" fill="white"/>`,
    ...svgParts.map((p) => `  ${p}`),
    `</svg>`,
  ].join("\n");

  downloadFile(
    svgContent,
    `${boardTitle.replace(/\s+/g, "_")}.svg`,
    "image/svg+xml",
  );
}

/** Escape special XML characters in text content */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
