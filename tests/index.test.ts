import { lines, splitToLines, LineLike, LinesBuilder, LinesBuilderOptions, setDefaultOptions, resetDefaultOptions } from "../src";
import * as os from "os";

jest.mock("os");

describe("LinesBuilder", () => {
  beforeEach(() => {
    (os.platform as unknown as jest.Mock).mockReturnValue("win32");
    resetDefaultOptions();
  });

  function testLines(l: LinesBuilder, expected: string[]) {
    expect(splitToLines(l.toString())).toEqual(expected);
  }

  function testLinesWithoutOptions(expected: string[], ...ls: LineLike[]) {
    return function () {
      testLines(lines(...ls), expected);
    };
  }

  function testLinesWithOptions(expected: string[], options: Partial<LinesBuilderOptions>, ...ls: LineLike[]) {
    return function () {
      testLines(lines(options, ...ls), expected);
    };
  }


  describe("constructor", () => {
    test("should handle single string parameter", testLinesWithoutOptions(["Hello World"], "Hello World"));

    test("should handle single string with multiline", testLinesWithoutOptions(["Hello", "World", "Again", "And", "Again"], "Hello\nWorld", "Again\r\nAnd\n\rAgain"));

    test("should trim lines by default", testLinesWithoutOptions(["Hello", "World"], " Hello \n World\t"));

    test("should not trim lines if ommited", testLinesWithOptions([" Hello ", " World\t"], { trimLeft: false, trimRight: false }, " Hello \n World\t"));

    test("should handle multiple parameters", testLinesWithoutOptions(["Hello", "World", "Again"], "Hello\nWorld", "Again"));

    test("should handle empty line", testLinesWithoutOptions(["Hello", "", "World"], "Hello", null, "World"));

    test("should skip empty line", testLinesWithOptions(["Hello", "World"], { skipEmpty: true }, "Hello", null, "World"));

    test("should handle empty arguments", testLinesWithoutOptions([""]));

    // @ts-ignore
    test("should ignore arguments with incorrect type", testLinesWithoutOptions([""], 1, undefined, {}, false))
  });

  describe("append", () => {
    test("should add lines to the end", () => {
      const l = lines("1st").append("2nd", null, "3rd\n4th");
      expect(splitToLines(l.toString())).toEqual(["1st", "2nd", "", "3rd", "4th"]);
    });
  });

  describe("prepend", () => {
    test("should add lines to the beginning", () => {
      const l = lines("4th").prepend("1st", null, "2nd\n3rd");
      expect(splitToLines(l.toString())).toEqual(["1st", "", "2nd", "3rd", "4th"]);
    });
  });

  describe("indent", () => {
    test("should not have indent by default", testLinesWithoutOptions(["1st", "2nd"], "1st", "2nd"));

    test("should add string indent", testLinesWithOptions(["--1st", "--2nd"], { indent: "--" }, "1st", "2nd"));

    test("should add number of space as indent", testLinesWithOptions(["  1st", "  2nd"], { indent: 2 }, "1st", "2nd"));

    test("should handle incorrect number of space as indent", testLinesWithOptions(["1st", "2nd"], { indent: -8 }, "1st", "2nd"));

    test("should not indent empty lines by default", testLinesWithOptions(["--1st", "", "--2nd"], { indent: "--" }, "1st", null, "2nd"));

    test("should indent empty lines if set", testLinesWithOptions(["--1st", "--", "--2nd", "--3rd", "--", "--4th"], { indent: "--", indentEmpty: true }, "1st", null, "2nd", "3rd\n\n4th"));
  });

  describe("nested", () => {
    test("should handle nested lines-builder", () => {
      const nested = lines("1st nested", "2nd nested");
      const parent = lines("1st parent", nested, "2nd parent");
      testLines(parent, ["1st parent", "1st nested", "2nd nested", "2nd parent"]);
    });

    test("should indent nested lines-builder", () => {
      const nested = lines({ indent: "==" }, "1st nested", "2nd nested");
      const parent = lines({ indent: "--" }, "1st parent", nested, "2nd parent");
      testLines(parent, ["--1st parent", "--==1st nested", "--==2nd nested", "--2nd parent"]);
    });

    test("should skip first level indent", () => {
      const nested = lines("1st nested", "2nd nested");
      const parent = lines({ indent: "--", skipFirstLevelIndent: true }, "1st parent", nested, "2nd parent");
      testLines(parent, ["1st parent", "--1st nested", "--2nd nested", "2nd parent"]);
    });

    test("should handle nested empty lines", () => {
      const nested = lines("1st nested", null, "2nd nested");
      const parent = lines({ indent: "--", indentEmpty: false }, "1st parent", nested, "2nd parent");
      testLines(parent, ["--1st parent", "--1st nested", "", "--2nd nested", "--2nd parent"]);
    });

    test("should skip nested empty lines if set", () => {
      const nested = lines("1st nested", null, "2nd nested");
      const parent = lines({ indent: "--", skipEmpty: true }, "1st parent", nested, "2nd parent");
      testLines(parent, ["--1st parent", "--1st nested", "--2nd nested", "--2nd parent"]);
    });
  });

  describe("EOL", () => {
    test("should handle Windows EOL", () => {
      (os.platform as unknown as jest.Mock).mockReturnValue("win32");
      const l = lines("A", "B");
      expect(l.toString()).toHaveLength(4);
    });
    test("should handle Unix EOL", () => {
      (os.platform as unknown as jest.Mock).mockReturnValue("unix");
      const l = lines("A", "B");
      expect(l.toString()).toHaveLength(3);
    });
    test("should use explicit EOL", () => {
      const l = lines({ eol: "EOL" }, "A", "B");
      expect(l.toString()).toEqual("AEOLB");
    });
  });

  describe("default options", () => {
    test("should handle invalid default options", () => {
      expect(() => setDefaultOptions(null)).toThrow(TypeError);
    });

    test("should handle default options", () => {
      setDefaultOptions({ indent: "__" });
      const nested = lines("1st nested", "2nd nested");
      const parent = lines("1st parent", nested, "2nd parent");
      testLines(parent, ["__1st parent", "____1st nested", "____2nd nested", "__2nd parent"]);
    });
  });

  describe("filter", () => {
    let l: LinesBuilder;

    beforeEach(() => {
      l = lines("simple", "# comment", "other # simple");
    });

    test("should handle string matcher", () => {
      l.filter("Comment");
      testLines(l, ["# comment"]);
    });

    test("should handle reverse string matcher", () => {
      l.filter("comment", true);
      testLines(l, ["simple", "other # simple"]);
    });

    test("should handle regexp matcher", () => {
      l.filter(/^#/);
      testLines(l, ["# comment"]);
    });

    test("should handle reverse regexp matcher", () => {
      l.filter(/#/, true);
      testLines(l, ["simple"]);
    });

    test("should handle function matcher", () => {
      l.filter((line: string, _: number) => line.includes("#"), true);
      testLines(l, ["simple"]);
    });

    test("should handle nested lines", () => {
      const parent = lines({ indent: null }, "parent", l, lines("# only comment"), "end");
      parent.filter(/#/, true);
      testLines(parent, ["parent", "simple", "end"]);
    });

    test("should handle missing matcher", () => {
      // @ts-ignore
      expect(() => l.filter()).toThrow("Matcher must be set!");
    })
  });

  describe("map", () => {
    let l: LinesBuilder;

    beforeEach(() => {
      l = lines("simple", "# comment", "other # simple", lines("second level"));
    });

    test("should handle missing mapper", () => {
      // @ts-ignore
      expect(() => l.map()).toThrow("Mapper must be set!");
    });

    test("should handle non-function mapper", () => {
      // @ts-ignore
      expect(() => l.map("hello")).toThrow("Mapper must be a function!");
    });

    test("should map lines", () => {
      l.map((line: string, i: number, level: number): string => {
        return `[${level}][${i}][${line}]`;
      });
      testLines(l, ["[0][0][simple]", "[0][1][# comment]", "[0][2][other # simple]", "[1][0][second level]"]);
    });
  });
});