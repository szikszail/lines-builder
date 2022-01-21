import * as os from "os";
import debug = require("debug");

const log = debug("lines-builder");

export type LineLike = string | LinesBuilder | null;

export interface LinesBuilderOptions {
  indent?: string | number;
  indentEmpty?: boolean;
  trim?: boolean;
}


export function splitToLines(s: string): string[] {
  return s.split(/\r?\n\r?/g);
}


export class LinesBuilder {
  private options: LinesBuilderOptions;
  private lines: LineLike[] = [];

  constructor(...ls: LineLike[]);
  constructor(options: Partial<LinesBuilderOptions>, ...ls: LineLike[]);
  constructor(...args: any[]) {
    log("LinesBuilder(args: %o)", args);
    let options: Partial<LinesBuilderOptions>;
    if (args[0] && typeof args[0] === "object" && !(args[0] instanceof LinesBuilder)) {
      options = args.shift();
    }
    this.options = {
      indent: null,
      trim: true,
      indentEmpty: false,
      ...(options || {}),
    };

    log("LinesBuilder.options: %o", this.options);
    if (typeof this.options.indent === "number") {
      this.options.indent = " ".repeat(Math.max(0, this.options.indent));
    }
    log("LinesBuilder.options: %o", this.options);

    this.lines = this.parseLines(args as LineLike[]);
    log("LinesBuilder.lines: %o", this.lines);
  }

  private parseLines(ls: LineLike[]): LineLike[] {
    log("parseLines(ls: %o)", ls);
    const parsedLines: LineLike[] = [];
    for (const line of ls) {
      if (typeof line === "string") {
        let splitedLines: string[] = splitToLines(line);
        if (this.options.trim) {
          splitedLines = splitedLines.map(l => l.trim());
        }
        parsedLines.push(...splitedLines);
      } else if (line instanceof LinesBuilder || line === null) {
        parsedLines.push(line);
      }
    }
    return parsedLines;
  }

  public toString(): string {
    log("toString:lines: %o", this.lines);
    const ls: string[] = [];
    const indent: string = this.options.indent as string ?? "";
    log("toString.indent: %o", indent);

    for (const line of this.lines) {
      log("toString.line: %o", line);
      if (typeof line === "string") {
        ls.push(`${indent}${line}`);
      } else if (line instanceof LinesBuilder) {
        const nestedLines = splitToLines(line.toString());
        ls.push(...nestedLines.map(l => `${indent}${l}`));
      } else {
        ls.push(this.options.indentEmpty ? indent : "");
      }
      log("toString.ls: %o", ls);
    }

    log("toString.platform: %s", os.platform());
    return ls.join(os.platform() == "win32" ? "\r\n" : "\n");
  }

  public append(...ls: LineLike[]): LinesBuilder {
    log("append(ls: %o)", ls);
    log("append.#lines: %d", this.lines.length);

    ls = this.parseLines(ls);
    this.lines.push(...ls);

    log("append.#lines: %d", this.lines.length);
    return this;
  }

  public prepend(...ls: LineLike[]): LinesBuilder {
    log("prepend(ls: %o)", ls);
    log("prepend.#lines: %d", this.lines.length);

    ls = this.parseLines(ls);
    this.lines.unshift(...ls);

    log("prepend.#lines: %d", this.lines.length);
    return this;
  }
}

export function lines(...ls: LineLike[]): LinesBuilder;
export function lines(options: Partial<LinesBuilderOptions>, ...ls: LineLike[]): LinesBuilder;
export function lines(...args: any[]): LinesBuilder {
  return new LinesBuilder(...args);
}