import * as os from "os";
import debug = require("debug");

const log = debug("lines-builder");

export type LineLike = string | LinesBuilder | null;

export interface LinesBuilderOptions {
  indent?: string | number | null;
  indentEmpty?: boolean;
  skipFirstLevelIndent?: boolean;
  skipEmpty?: boolean;
  trimLeft?: boolean;
  trimRight?: boolean;
  eol?: string | null;
}

export type LineMather = (line: string, i: number) => boolean;
export type LineMapper = (line: string, i: number, level: number) => string;

export function splitToLines(s: string): string[] {
  return s.split(/\r?\n\r?/g);
}

const DEFAULT_OPTIONS: LinesBuilderOptions = {
  indent: null,
  trimLeft: true,
  trimRight: true,
  indentEmpty: false,
  skipFirstLevelIndent: false,
  skipEmpty: false,
  eol: null,
};

export class LinesBuilder {
  private static DEFAULT_OPTIONS: LinesBuilderOptions = {
    ...DEFAULT_OPTIONS,
  };
  private options: LinesBuilderOptions;
  private lines: LineLike[] = [];

  get length(): number {
    return this.lines.length;
  }

  constructor(...ls: LineLike[]);
  constructor(options: Partial<LinesBuilderOptions>, ...ls: LineLike[]);
  constructor(...args: any[]) {
    log("LinesBuilder(args: %o)", args);
    let options: Partial<LinesBuilderOptions>;
    if (args[0] && typeof args[0] === "object" && !(args[0] instanceof LinesBuilder)) {
      options = args.shift();
    }
    this.options = {
      ...LinesBuilder.DEFAULT_OPTIONS,
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

  public static resetDefaultOptions(): LinesBuilderOptions {
    log("resetDefaultOptions.prev: %o", LinesBuilder.DEFAULT_OPTIONS);
    LinesBuilder.DEFAULT_OPTIONS = { ...DEFAULT_OPTIONS };
    log("resetDefaultOptions.new: %o", LinesBuilder.DEFAULT_OPTIONS);
    return LinesBuilder.DEFAULT_OPTIONS;
  }

  public static setDefaultOptions(options: Partial<LinesBuilderOptions>): LinesBuilderOptions {
    log("setDefaultOptions(options: %o)", options);
    if (typeof options !== "object" || !options) {
      throw new TypeError("Options must be a LinesBuilderOptions!");
    }
    log("setDefaultOptions.prev: %o", LinesBuilder.DEFAULT_OPTIONS);
    LinesBuilder.DEFAULT_OPTIONS = {
      ...LinesBuilder.DEFAULT_OPTIONS,
      ...options,
    };
    log("setDefaultOptions.next: %o", LinesBuilder.DEFAULT_OPTIONS);
    return LinesBuilder.DEFAULT_OPTIONS;
  }

  private parseLines(ls: LineLike[]): LineLike[] {
    log("parseLines(ls: %o)", ls);
    const parsedLines: LineLike[] = [];
    for (const line of ls) {
      log("parseLines.line: %o", line)
      if (typeof line === "string") {
        let splitedLines: string[] = splitToLines(line);
        if (this.options.trimLeft) {
          splitedLines = splitedLines.map(l => l.trimLeft());
        }
        if (this.options.trimRight) {
          splitedLines = splitedLines.map(l => l.trimRight());
        }
        parsedLines.push(...splitedLines);
      } else if (line instanceof LinesBuilder || line === null) {
        parsedLines.push(line);
      }
      log("parseLines.parsedLines: %o", parsedLines);
    }
    return parsedLines;
  }

  public toString(): string {
    log("toString:lines: %o", this.lines);
    const ls: string[] = [];
    const indent: string = this.options.indent as string ?? "";
    const firstIndent: string = this.options.skipFirstLevelIndent ? "" : indent;
    log("toString.indent: %o", indent);

    for (const line of this.lines) {
      log("toString.line: %o", line);
      if (typeof line === "string" && line) {
        ls.push(`${firstIndent}${line}`);
      } else if (line instanceof LinesBuilder) {
        const nestedLines = splitToLines(line.toString());
        for (const l of nestedLines) {
          if (l) {
            ls.push(`${indent}${l}`);
          } else if (!this.options.skipEmpty) {
            ls.push(this.options.indentEmpty ? indent : "");
          }
        }
      } else if (!this.options.skipEmpty) {
        ls.push(this.options.indentEmpty ? indent : "");
      }
      log("toString.ls: %o", ls);
    }

    let eol: string = this.options.eol;
    if (!eol) {
      log("toString.platform: %s", os.platform());
      eol = os.platform() == "win32" ? "\r\n" : "\n";
    }
    log("toString.eol: %o", eol);

    return ls.join(eol);
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

  public filter(matcher: string, reverse?: boolean): void;
  public filter(matcher: RegExp, reverse?: boolean): void;
  public filter(matcher: LineMather, reverse?: boolean): void;
  public filter(matcher: string | RegExp | LineMather, reverse?: boolean): void {
    log("filter(matcher: %o, reverse: %b)", matcher, reverse);
    if (!matcher) {
      throw new TypeError("Matcher must be set!");
    }
    if (typeof matcher === "string") {
      matcher = new RegExp(matcher, "i");
    }
    let matcherFn: LineMather;
    if (matcher instanceof RegExp) {
      matcherFn = (line: string, _: number): boolean => (matcher as RegExp).test(line);
    } else {
      matcherFn = matcher;
    }
    this.lines = this.lines.filter((line: LineLike, i: number): boolean => {
      if (line instanceof LinesBuilder) {
        log("filter.nested(original: %d)", line.length);
        line.filter(matcherFn, reverse);
        log("filter.nested(result: %d)", line.length);
        return line.length > 0;
      }
      const result = matcherFn(line, i);
      log("filter.string(result: %b)", result);
      return !!result !== !!reverse;
    });
  }

  protected internalMap(mapper: LineMapper, level: number): void {
    log("internalMap(mapper: %o, level: %d)", mapper, level);
    this.lines = this.lines.map((line: LineLike, i: number): LineLike => {
      if (line instanceof LinesBuilder) {
        log("internalMap.nested(original: %d)", line.length);
        line.internalMap(mapper, level + 1);
        return line;
      }
      return mapper(line, i, level);
    })
  }

  public map(mapper: LineMapper): void {
    log("map(mapper: %o)", mapper);
    if (!mapper) {
      throw new TypeError("Mapper must be set!");
    }
    if (typeof mapper !== "function") {
      throw new TypeError("Mapper must be a function!");
    }
    this.internalMap(mapper, 0);
  }
}

export const setDefaultOptions = LinesBuilder.setDefaultOptions;
export const resetDefaultOptions = LinesBuilder.resetDefaultOptions;

export function lines(...ls: LineLike[]): LinesBuilder;
export function lines(options: Partial<LinesBuilderOptions>, ...ls: LineLike[]): LinesBuilder;
export function lines(...args: any[]): LinesBuilder {
  return new LinesBuilder(...args);
}