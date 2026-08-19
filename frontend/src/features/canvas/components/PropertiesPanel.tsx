import { useCanvasStore } from "../state/canvas.store";
import type { CanvasElement } from "../types/canvas.types";



const STROKE_COLORS = [
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ffffff",
];

const BG_COLORS = [
  "transparent",
  "#fef2f2",
  "#fff7ed",
  "#fefce8",
  "#f0fdf4",
  "#eff6ff",
  "#f5f3ff",
  "#fdf4ff",
  "#f9fafb",
];



function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

interface SwatchGridProps {
  colors: string[];
  selected: string;
  onChange: (color: string) => void;
}

function SwatchGrid({ colors, selected, onChange }: SwatchGridProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          title={color === "transparent" ? "Transparent" : color}
          onClick={() => onChange(color)}
          className={`h-6 w-6 rounded-md border-2 transition-all ${
            selected === color
              ? "border-blue-500 scale-110 shadow-md"
              : "border-slate-200 hover:border-slate-400"
          }`}
          style={{
            backgroundColor: color === "transparent" ? "white" : color,
            backgroundImage:
              color === "transparent"
                ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                : undefined,
            backgroundSize: color === "transparent" ? "8px 8px" : undefined,
            backgroundPosition:
              color === "transparent"
                ? "0 0, 0 4px, 4px -4px, -4px 0px"
                : undefined,
          }}
        />
      ))}
      {/* Custom color input */}
      <label
        title="Custom color"
        className="relative h-6 w-6 cursor-pointer overflow-hidden rounded-md border-2 border-dashed border-slate-300 hover:border-blue-400"
      >
        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-400">
          +
        </span>
        <input
          type="color"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          value={selected === "transparent" ? "#000000" : selected}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}

interface SliderProps {
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
}

function Slider({ label, min, max, step = 1, value, onChange, unit }: SliderProps) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <SectionLabel>{label}</SectionLabel>
        <span className="text-[11px] font-medium text-slate-600">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
}



export default function PropertiesPanel() {
  const selectedElementId = useCanvasStore((s) => s.selectedElementId);
  const elements = useCanvasStore((s) => s.elements);
  const updateElement = useCanvasStore((s) => s.updateElement);

  if (!selectedElementId) return null;

  const element = elements.find((el) => el.id === selectedElementId);
  if (!element) return null;

  const update = (updates: Partial<CanvasElement>) =>
    updateElement(selectedElementId, updates);

  const isText = element.type === "text";
  const hasStrokeFill =
    element.type !== "line" &&
    element.type !== "arrow" &&
    element.type !== "freedraw";

  return (
    <div
      className="fixed right-4 top-1/2 z-20 flex w-56 -translate-y-1/2 flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-2xl backdrop-blur-md"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-blue-500" />
        <p className="text-[12px] font-semibold capitalize text-slate-700">
          {element.type}
        </p>
      </div>

      <hr className="border-slate-100" />

      {/* Stroke color */}
      <div>
        <SectionLabel>Stroke</SectionLabel>
        <SwatchGrid
          colors={STROKE_COLORS}
          selected={element.strokeColor}
          onChange={(c) => update({ strokeColor: c } as Partial<CanvasElement>)}
        />
      </div>

      {/* Background color — not for lines/arrows/freedraw */}
      {hasStrokeFill && (
        <div>
          <SectionLabel>Background</SectionLabel>
          <SwatchGrid
            colors={BG_COLORS}
            selected={element.backgroundColor}
            onChange={(c) =>
              update({ backgroundColor: c } as Partial<CanvasElement>)
            }
          />
        </div>
      )}

      {/* Stroke width — not for text */}
      {!isText && (
        <Slider
          label="Stroke Width"
          min={1}
          max={20}
          value={element.strokeWidth}
          onChange={(v) => update({ strokeWidth: v } as Partial<CanvasElement>)}
          unit="px"
        />
      )}

      {/* Opacity */}
      <Slider
        label="Opacity"
        min={0}
        max={1}
        step={0.05}
        value={element.opacity ?? 1}
        onChange={(v) => update({ opacity: v } as Partial<CanvasElement>)}
        unit=""
      />

      {/* Font controls — text only */}
      {isText && element.type === "text" && (
        <>
          <div>
            <SectionLabel>Font Size</SectionLabel>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={8}
                max={200}
                value={element.fontSize}
                onChange={(e) =>
                  update({
                    fontSize: Number(e.target.value),
                    height: Number(e.target.value) * 1.4,
                  } as Partial<CanvasElement>)
                }
                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
              />
              <span className="text-xs text-slate-400">px</span>
            </div>
          </div>

          <div>
            <SectionLabel>Font Family</SectionLabel>
            <select
              value={element.fontFamily}
              onChange={(e) =>
                update({ fontFamily: e.target.value } as Partial<CanvasElement>)
              }
              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none"
            >
              <option value="Inter, Arial, sans-serif">Inter</option>
              <option value="Georgia, serif">Georgia</option>
              <option value="'Courier New', monospace">Monospace</option>
              <option value="'Comic Sans MS', cursive">Handwritten</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}
