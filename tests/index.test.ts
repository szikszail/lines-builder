import { lines, splitToLines, LineLike, LinesBuilder, LinesBuilderOptions } from "../src";
import * as os from "os";

jest.mock("os");

describe("LinesBuilder", () => {
  beforeEach(() => {
    (os.platform as unknown as jest.Mock).mockReturnValue("win32");
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

    test("should not trim lines if ommited", testLinesWithOptions([" Hello ", " World\t"], { trim: false }, " Hello \n World\t"));

    test("should handle multiple parameters", testLinesWithoutOptions(["Hello", "World", "Again"], "Hello\nWorld", "Again"));

    test("should handle empty line", testLinesWithoutOptions(["Hello", "", "World"], "Hello", null, "World"));

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

    test("should indent empty lines if set", testLinesWithOptions(["--1st", "--", "--2nd"], { indent: "--", indentEmpty: true }, "1st", null, "2nd"));
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
  });

  describe("OS", () => {
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
  });
});