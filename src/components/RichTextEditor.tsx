import { useEffect, useRef, useCallback } from "react";
import { Bold, Italic, Underline, Strikethrough, Heading2, Heading3, List, ListOrdered, Quote, Undo, Redo } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
}

function ToolButton({ icon, label, onClick, isActive }: ToolButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
        isActive
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
      }`}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync external value into the contentEditable when it changes externally
  // (e.g. loading a chapter), but avoid clobbering the DOM while the user
  // is typing (internal changes propagate up via onInput).
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const exec = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      exec("bold");
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      exec("italic");
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
      e.preventDefault();
      exec("underline");
    }
  }, [exec]);

  const tools: { icon: React.ReactNode; label: string; command: string; val?: string }[] = [
    { icon: <Bold size={16} />, label: "Bold", command: "bold" },
    { icon: <Italic size={16} />, label: "Italic", command: "italic" },
    { icon: <Underline size={16} />, label: "Underline", command: "underline" },
    { icon: <Strikethrough size={16} />, label: "Strikethrough", command: "strikeThrough" },
    { icon: <Heading2 size={16} />, label: "Heading 2", command: "formatBlock", val: "h2" },
    { icon: <Heading3 size={16} />, label: "Heading 3", command: "formatBlock", val: "h3" },
    { icon: <List size={16} />, label: "Bullet list", command: "insertUnorderedList" },
    { icon: <ListOrdered size={16} />, label: "Numbered list", command: "insertOrderedList" },
    { icon: <Quote size={16} />, label: "Quote", command: "formatBlock", val: "blockquote" },
    { icon: <Undo size={16} />, label: "Undo", command: "undo" },
    { icon: <Redo size={16} />, label: "Redo", command: "redo" },
  ];

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-600">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-600 dark:bg-slate-900/50">
        {tools.map((t) => (
          <ToolButton
            key={t.label}
            icon={t.icon}
            label={t.label}
            onClick={() => exec(t.command, t.val)}
          />
        ))}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        className="rich-text-editor min-h-[400px] w-full px-4 py-3 font-serif text-sm leading-relaxed text-slate-800 outline-none dark:text-slate-200"
      />
    </div>
  );
}
