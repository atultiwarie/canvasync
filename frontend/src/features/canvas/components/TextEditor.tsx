import { useEffect, useRef } from "react";

type TextEditorProps = {
  screenX: number;
  screenY: number;
  initialValue: string;
  zoom: number;
  onSubmit: (text: string) => void;
  onCancel: () => void;
};

export default function TextEditor({
  screenX,
  screenY,
  initialValue,
  zoom,
  onSubmit,
  onCancel,
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isSubmitting = useRef(false);

  const adjustSize = () => {
    const el = textareaRef.current;
    if (!el) return;

    // Reset dimensions so scrollHeight and scrollWidth accurately reflect full content
    el.style.height = "auto";
    el.style.width = "auto";

    // Set expanding dimensions so all multiline text is always 100% visible
    const newHeight = Math.max(el.scrollHeight, 30 * zoom);
    const newWidth = Math.max(el.scrollWidth + 12, 120 * zoom);

    el.style.height = `${newHeight}px`;
    el.style.width = `${newWidth}px`;
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
        adjustSize();
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  const submit = () => {
    if (isSubmitting.current) return;

    const value = textareaRef.current?.value.trim();

    if (!value) {
      onCancel();
      return;
    }

    isSubmitting.current = true;
    onSubmit(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }

    // Ctrl+Enter or Cmd+Enter submits; plain Enter creates a new line dynamically
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit();
    }
  };

  const fontSize = 24 * (zoom || 1);

  return (
    <textarea
      ref={textareaRef}
      defaultValue={initialValue}
      onPointerDown={(event) => event.stopPropagation()}
      onInput={adjustSize}
      onKeyDown={handleKeyDown}
      onBlur={submit}
      style={{
        position: "fixed",
        left: screenX,
        top: screenY,
        zIndex: 20,
        minWidth: `${100 * zoom}px`,
        background: "transparent",
        border: "none",
        outline: "none",
        boxShadow: "none",
        padding: "0",
        margin: "0",
        resize: "none",
        overflow: "hidden",
        fontSize: `${fontSize}px`,
        lineHeight: "1.3",
        fontFamily: "Arial, sans-serif",
        color: "#000000",
        caretColor: "#2563eb",
        whiteSpace: "pre",
      }}
    />
  );
}
