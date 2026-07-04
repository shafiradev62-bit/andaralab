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
  /**
   * Upload any remaining base64 images in the editor DOM, replace their src
   * with the returned /images/… URL, then return the body lines.
   * Call this instead of flush() when saving a post.
   */
  preflush: () => Promise<string[]>;
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

    /**
     * Scan the editor DOM for any <img> elements still using a base64 data URL
     * (e.g. pasted before the onPaste handler was deployed, or via drag-and-drop).
     * Upload each one, swap the src to the returned /images/… URL, then return
     * the serialised body lines. Safe to call even when there are no base64 images.
     */
    const preflushAsync = useCallback(async (): Promise<string[]> => {
      if (editorRef.current) {
        const base64Imgs = Array.from(
          editorRef.current.querySelectorAll('img[src^="data:"]'),
        ) as HTMLImageElement[];

        for (const img of base64Imgs) {
          try {
            const dataUrl = img.getAttribute("src") ?? "";
            // Quick size guard — skip if > 10 MB decoded (upload would reject anyway)
            const base64Data = dataUrl.split(",")[1] ?? "";
            if (base64Data.length > 13_500_000) continue; // ~10 MB base64
            // Send dataUrl directly — no sync byte loop needed
            const res = await fetch("/api/upload/image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dataUrl, filename: "pasted-image.png" }),
            });
            if (res.ok) {
              const { url } = (await res.json()) as { url: string };
              img.setAttribute("src", url);
            }
            // If upload fails, base64 filter in htmlToBodyLines strips it safely.
          } catch {
            /* ignore individual image errors */
          }
        }
      }
      const lines = readLinesFromDom();
      const serialized = JSON.stringify(lines);
      lastSerialized.current = serialized;
      onChange(lines);
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
        preflush: preflushAsync,
      }),
      [onChange, readLinesFromDom, preflushAsync],
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

    /**
     * Insert an image figure at `savedRange` (or the live selection if not
     * provided). Accepting a pre-captured range lets callers like uploadImage
     * save the cursor position before any async work that would clear it.
     */
    const insertImageUrl = async (
      url: string,
      savedRange: Range | null = null,
    ) => {
      if (!url.trim() || !editorRef.current) return;

      const figure = document.createElement("figure");
      figure.dataset.type = "img";
      figure.contentEditable = "false";
      figure.className = "my-6 border border-gray-200 rounded overflow-hidden";
      figure.innerHTML = `<img src="${url.replace(/"/g, "&quot;")}" alt="" class="w-full h-auto" />`;
      const spacer = document.createElement("p");
      spacer.innerHTML = "<br>";

      // Use the saved range when provided (e.g. from uploadImage which loses
      // focus during async fetch), otherwise read the live selection.
      const rangeToUse = savedRange ?? (() => {
        const sel = window.getSelection();
        return sel && sel.rangeCount > 0 ? sel.getRangeAt(0) : null;
      })();

      if (rangeToUse) {
        // Walk up from the range anchor to find the direct child of the editor
        // so the figure is always inserted as a top-level block, never nested.
        let block: Node = rangeToUse.startContainer;
        while (block.parentNode && block.parentNode !== editorRef.current) {
          block = block.parentNode;
        }
        if (
          block.parentNode === editorRef.current &&
          block !== editorRef.current
        ) {
          (block as Element).after(figure, spacer);
        } else {
          editorRef.current.appendChild(figure);
          editorRef.current.appendChild(spacer);
        }
      } else {
        editorRef.current.appendChild(figure);
        editorRef.current.appendChild(spacer);
      }

      // Move cursor into the spacer paragraph right after the image.
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        const newRange = document.createRange();
        newRange.setStart(spacer, 0);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }

      syncToParent();
    };

    /**
     * Upload a File and insert the returned URL into the editor at the current
     * cursor position. FileReader is wrapped in a Promise so we can properly
     * await it — using only the onload callback without a Promise would cause
     * a race condition where insertImageUrl runs before the upload completes.
     */
    const uploadImage = async (file: File) => {
      // Capture selection NOW, before async work causes it to be lost.
      const savedSelection = (() => {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) return sel.getRangeAt(0).cloneRange();
        return null;
      })();

      let dataUrl: string;
      try {
        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      } catch {
        alert("Gagal membaca file.");
        return;
      }

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
        await insertImageUrl(url, savedSelection);
      } catch (err: unknown) {
        alert(
          `Upload error: ${err instanceof Error ? err.message : "unknown"}`,
        );
      }
    };

    /**
     * Intercept paste events to prevent images from being embedded as base64
     * data URLs. If the clipboard contains an image file, upload it instead
     * and insert the returned /images/… URL as a proper figure block.
     */
    const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (imageItem) {
        e.preventDefault(); // stop browser from embedding base64
        const file = imageItem.getAsFile();
        if (file) await uploadImage(file);
        return;
      }
      // Non-image paste (text, HTML) — let browser handle normally,
      // but sync after a tick so DOM is updated.
      setTimeout(syncToParent, 0);
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
              onPaste={handlePaste}
              onKeyDown={(e) => {
                if (e.ctrlKey && e.key === "b") {
                  e.preventDefault();
                  exec("bold");
                }
              }}
              className="blog-doc-editor outline-none text-gray-800 min-h-[360px] [&_h1]:text-[26px] [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-[20px] [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-3 [&_h3]:text-[16px] [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:text-[14.5px] [&_p]:leading-[1.8] [&_p]:mb-4 [&_strong]:font-bold [&_strong]:text-gray-900 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_li]:text-[14.5px] [&_li]:leading-[1.8] [&_li]:mb-1"
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
