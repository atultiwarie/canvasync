import { useEffect, useRef } from "react";

type TextEditorProps = {
  screenX: number;
  screenY: number;

  initialValue: string;

  onSubmit: (text: string) => void;

  onCancel: () => void;
};

export default function TextEditor({
  screenX,
  screenY,
  initialValue,
  onSubmit,
  onCancel,
}: TextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isSubmitting = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.select();
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, []);

const submit = () => {
  if (isSubmitting.current) {
    return;
  }

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

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
      return;
    }

    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      defaultValue={initialValue}
      onPointerDown={(event) => event.stopPropagation()}
      onKeyDown={handleKeyDown}
      className="fixed z-20 min-h-[40px] min-w-[150px] resize rounded border border-blue-500 bg-white/95 p-1 text-[24px] leading-tight outline-none"
      style={{
        left: screenX,
        top: screenY,
      }}
      onBlur={submit}
    />
  );
}
