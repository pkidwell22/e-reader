import { getFileExtension } from "@/lib/utils";

export type FileFormat =
  | "txt"
  | "markdown"
  | "html"
  | "pdf"
  | "epub"
  | "docx"
  | "doc"
  | "rtf"
  | "mobi"
  | "azw"
  | "fb2"
  | "odt"
  | "cbz"
  | "cbr"
  | "svg"
  | "image"
  | "code"
  | "json"
  | "csv"
  | "xml"
  | "yaml"
  | "unknown";

const EXTENSION_MAP: Record<string, FileFormat> = {
  // Text
  txt: "txt",
  text: "txt",
  log: "txt",

  // Markdown
  md: "markdown",
  markdown: "markdown",
  mdx: "markdown",
  mkd: "markdown",

  // HTML
  html: "html",
  htm: "html",
  xhtml: "html",

  // PDF
  pdf: "pdf",

  // EPUB
  epub: "epub",

  // Word
  docx: "docx",
  doc: "doc",

  // RTF
  rtf: "rtf",

  // Kindle
  mobi: "mobi",
  azw: "azw",
  azw3: "azw",

  // FictionBook
  fb2: "fb2",

  // OpenDocument
  odt: "odt",

  // Comics
  cbz: "cbz",
  cbr: "cbr",

  // SVG
  svg: "svg",

  // Images
  jpg: "image",
  jpeg: "image",
  png: "image",
  gif: "image",
  webp: "image",
  avif: "image",
  bmp: "image",
  tiff: "image",
  tif: "image",

  // Data
  json: "json",
  csv: "csv",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  toml: "yaml",

  // Code
  py: "code",
  js: "code",
  ts: "code",
  tsx: "code",
  jsx: "code",
  go: "code",
  rs: "code",
  java: "code",
  c: "code",
  cpp: "code",
  h: "code",
  hpp: "code",
  rb: "code",
  swift: "code",
  kt: "code",
  sh: "code",
  bash: "code",
  zsh: "code",
  css: "code",
  scss: "code",
  less: "code",
  sql: "code",
  php: "code",
  r: "code",
  lua: "code",
  dart: "code",
  scala: "code",
  zig: "code",
  nim: "code",
  ex: "code",
  exs: "code",
  erl: "code",
  hs: "code",
  ml: "code",
  v: "code",
  vue: "code",
  svelte: "code",
};

// Magic byte signatures
const MAGIC_BYTES: [Uint8Array, FileFormat][] = [
  [new Uint8Array([0x25, 0x50, 0x44, 0x46]), "pdf"], // %PDF
  [new Uint8Array([0x50, 0x4b, 0x03, 0x04]), "epub"], // PK (ZIP — could be epub, docx, odt, cbz)
  [new Uint8Array([0x7b, 0x5c, 0x72, 0x74, 0x66]), "rtf"], // {\rtf
];

export function detectFormat(file: File, buffer?: ArrayBuffer): FileFormat {
  // 1. Try extension first
  const ext = getFileExtension(file.name);
  if (ext && EXTENSION_MAP[ext]) {
    return EXTENSION_MAP[ext];
  }

  // 2. Try MIME type
  if (file.type) {
    if (file.type === "application/pdf") return "pdf";
    if (file.type === "application/epub+zip") return "epub";
    if (file.type.startsWith("image/svg")) return "svg";
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "text/html") return "html";
    if (file.type === "text/markdown") return "markdown";
    if (file.type === "text/plain") return "txt";
    if (file.type === "application/json") return "json";
    if (file.type === "text/csv") return "csv";
    if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
      return "docx";
  }

  // 3. Try magic bytes
  if (buffer && buffer.byteLength >= 5) {
    const bytes = new Uint8Array(buffer.slice(0, 8));
    for (const [signature, format] of MAGIC_BYTES) {
      if (
        signature.every((byte, i) => bytes[i] === byte)
      ) {
        // ZIP-based: disambiguate via extension
        if (format === "epub" && ext === "docx") return "docx";
        if (format === "epub" && ext === "odt") return "odt";
        if (format === "epub" && ext === "cbz") return "cbz";
        return format;
      }
    }
  }

  return "unknown";
}
