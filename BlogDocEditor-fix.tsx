import {
  forwardRef,
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
} from "react";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  List,
  Pilcrow,
  ImagePlus,
  UploadCloud,
} from "lucide-react";
import { bodyLinesToHtml, htmlToBodyLines } from "@/lib/blog-doc-editor";

type BlogDocEditorProps = {
  value: string[];
  onChange: (lines: string[]) => void;
};

export type BlogDocEditorHandle = {
  /** Read editor DOM and return latest body lines (call before save). */
  flush: () => string[];
};

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`p-2 rounded-md transition-colors ${
        active
          ? "bg-gray-900 text-white"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
    >
      {children}
    </button>
  );
}

const BlogDocEditor = forwardRef<BlogDocEditorHandle, BlogDocEditorProps>(
  function BlogDocEditor({ value, onChange }, ref) {
    const editorRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const lastSerialized = useRef("");

    const readLinesFromDom = useCallback((): string[] => {
      if (!editorRef.current) return value.length ? value : [""];
      return htmlToBodyLines(editorRef.current);
    }, [value]);

    const syncToParent = useCallback(() => {
      const lines = readLinesFromDom();
      const serialized = JSON.stringify(lines);
      if (serialized !== lastSerialized.current) {
        lastSerialized.current = serialized;
        onChange(lines);
      }
      return lines;
    }, [onChange, readLinesFromDom]);

    useImperativeHandle(
      ref,
      () => ({
        flush: () => {
          const lines = readLinesFromDom();
          const serialized = JSON.stringify(lines);
          lastSerialized.current = serialized;
          onChange(lines);
          return lines;
        },
      }),
      [onChange, readLinesFromDom],
    );

    useEffect(() => {
      const serialized = JSON.stringify(value);
      if (serialized === lastSerialized.current) return;
      lastSerialized.current = serialized;
      if (editorRef.current) {
        editorRef.current.innerHTML = bodyLinesToHtml(value);
      }
    }, [value]);

    const focusEditor = () => editorRef.current?.focus();

    const exec = (command: string, val?: string) => {
      focusEditor();
      document.execCommand(command, false, val);
      syncToParent();
    };

    const setBlock = (tag: string) => {
      focusEditor();
      document.execCommand("formatBlock", false, tag);
      syncToParent();
    };

    const insertImageUrl = async (url: string) => {
      if (!url.trim() || !editorRef.current) return;

      // Build a simple paragraph that contains ONLY the img.
      // Do NOT use contentEditable="false" — Chrome wraps those in divs,
      // breaking htmlToBodyLines extraction.
      // Instead: <figure data-type="img"> without contentEditable attr.
      const figure = document.createElement("figure");
      figure.dataset.type = "img";
      figure.className = "my-6 border border-gray-200 rounded overflow-hidden";
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.className = "w-full h-auto";
      figure.appendChild(img);

      // Always append as top-level sibling of editor children.
      // Walk up from cursor to find the direct child of the editor.
      const spacer = document.createElement("p");
      spacer.innerHTML = "<br>";

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        let block: Node = range.startContainer;
        while (block.parentNode && block.parentNode !== editorRef.current) {
          block = block.parentNode;
        }
        if (block.parentNode === editorRef.current && block !== editorRef.current) {
          (block as Element).after(figure, spacer);
        } else {
          editorRef.current.appendChild(figure);
          editorRef.current.appendChild(spacer);
        }
      } else {
        editorRef.current.appendChild(figure);
        editorRef.current.appendChild(spacer);
      }

      // Move cursor to the spacer paragraph after the image
      focusEditor();
      const newRange = document.createRange();
      newRange.setStart(spacer, 0);
      newRange.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(newRange);

      syncToParent();
    };

    const uploadImage = async (file: File) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        try {
          const res = await fetch("/api/upload/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dataUrl, filename: file.name }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(
              `Upload gagal: ${(err as { error?: string }).error ?? res.statusText}`,
            );
            return;
          }
          const { url } = (await res.json()) as { url: string };
          await insertImageUrl(url);
        } catch (err: unknown) {
          alert(
            `Upload error: ${err instanceof Error ? err.message : "unknown"}`,
          );
        }
      };
      reader.readAsDataURL(file);
    };

    const lineCount = value.filter((l) => l.trim()).length;

    return (
      <div className="rounded-xl border border-[#E5E7EB] overflow-hidden bg-[#F3F4F6]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
          <ToolbarButton onClick={() => exec("bold")} title="Bold (Ctrl+B)">
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <ToolbarButton onClick={() => setBlock("h1")} title="Heading 1">
            <Heading1 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setBlock("h2")} title="Heading 2">
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setBlock("h3")} title="Heading 3">
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => setBlock("p")} title="Normal paragraph">
            <Pilcrow className="w-4 h-4" />
          </ToolbarButton>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <ToolbarButton
            onClick={() => exec("insertUnorderedList")}
            title="Bullet list"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <ToolbarButton
            onClick={() => {
              const url = window.prompt("Paste image URL:");
              if (url) void insertImageUrl(url);
            }}
            title="Insert image from URL"
          >
            <ImagePlus className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => fileRef.current?.click()}
            title="Upload image"
          >
            <UploadCloud className="w-4 h-4" />
          </ToolbarButton>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadImage(file);
              e.target.value = "";
            }}
          />
          <span className="ml-auto text-[10.5px] text-gray-400 hidden sm:inline">
            Doc editor · {lineCount} block{lineCount !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Document page */}
        <div className="p-4 md:p-8 max-h-[70vh] overflow-y-auto">
          <div className="max-w-[720px] mx-auto bg-white shadow-md border border-gray-200 min-h-[480px] px-8 md:px-14 py-10 md:py-14">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncToParent}
              onBlur={syncToParent}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === "b") {
                  e.preventDefault();
                  exec("bold");
                }
              }}
              className="blog-doc-editor outline-none text-gray-800 min-h-[360px] [&_h1]:text-[26px] [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-3 [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:text-[14.5px] [&_p]:leading-[1.8] [&_p]:mb-4 [&_strong]:font-bold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:text-[14.5px] [&_li]:leading-[1.8] [&_li]:mb-1 [&_figure]:my-6 [&_figure]:border [&_figure]:border-gray-200 [&_figure]:rounded [&_figure]:overflow-hidden [&_figure_img]:w-full [&_figure_img]:h-auto"
              data-placeholder="Mulai menulis artikel…"
            />
          </div>
        </div>

        <p className="px-4 py-2 text-[10.5px] text-gray-400 bg-white border-t border-[#E5E7EB]">
          Format seperti Google Docs: pilih teks lalu Bold / Heading. Konten
          tersimpan otomatis ke format live site (#, ##, **bold**, [IMG: url]).
        </p>
      </div>
    );
  },
);

export default BlogDocEditor;
