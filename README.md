# lines-builder

![Downloads](https://img.shields.io/npm/dw/lines-builder?style=flat-square) ![Version@npm](https://img.shields.io/npm/v/lines-builder?label=version%40npm&style=flat-square) ![Version@git](https://img.shields.io/github/package-json/v/szikszail/lines-builder/main?label=version%40git&style=flat-square) ![CI](https://img.shields.io/github/workflow/status/szikszail/lines-builder/CI/main?label=ci&style=flat-square) ![Docs](https://img.shields.io/github/workflow/status/szikszail/lines-builder/Docs/main?label=docs&style=flat-square)

Tool and model to handle string lines and indentation.

## Usage

To create a **new lines-builder** object:

```typescript
import { lines } from "lines-builder";

const l = lines("Hello World\nThis is the 2nd line");
console.log(l);
// Hello World
// This is the 2nd line
```

`lines` accepts an optional `options` object and any additional string (or lines-builder) as lines.

### Options

| Option | Type | Description | Default |
|:-------|:-----|:------------|:--------|
| `indent` | `string|number` | The indentation to use to indent the lines (exact string or the number of spaces). | `null` (no indentation) |
| `indentEmpty` | `boolean` | Whether the empty lines should still be indented. | `false` |
| `skipFirstLevelIndent` | `boolean` | Whether only the nested lines-builders should be indented. | `false` |
| `skipEmpty` | `boolean` | Whether empty lines should be added to the output string. | `false` |
| `trimLeft` | `boolean` | Can trailing white spaces be trimmed from the parsed lines. | `true` |
| `trimRight` | `boolean` | Can leading white spaces be trimmed from the parsed lines. | `true` |
| `eol` | `string` | The line-break to be used. If not set, it is determined based on the platform. | `null` |

### Append 

You can **append any lines**, including new line to the end (in place), passing any string (or lines-builder) as arguments to `append` :

```typescript
l.append("3rd line", null, "4th line\nand 5th line");
console.log(l);
// Hello World
// This is the 2nd line
// 3rd line
// 
// 4th line
// 5th line
```

### Prepend

You can **prepend any lines**, including new-line to the beginning (in place), passing any string (or lines-builder) as arguments to `prepend` :

```typescript
l.prepend("This is the title", null, "And the 0th line");
console.log(l);
// This is the title
// 
// And the 0th line
// Hello World
// This is the 2nd line
// 3rd line
// 
// 4th line
// 5th line
```

### Indent

You can set a **global indentation** to the lines added:

```typescript
const l = lines({ indent: '--' }, "Hello World", "2nd line");
console.log(l);
// --Hello World
// --2nd line
```

By default, **no indentation** is set.

You can also set a **number** as the indentation. In this case, the given number of spaces will be used.

### Trim

By default, lines-builder **trims** the leading and trailing **whitespaces**, but you can turn it off:

```typescript
const l = lines({ trimLeft: false, trimRight: false }, "Hello World  ", "  2nd line\n  3rd line");
console.log(l);
// Hello World
//   2nd line
//   3rd line
```

### Nesting

Lines-builder accepts another lines-builder instance instead of any string lines, to be able to nest it:

```typescript
const nested = lines({ indent: '==' }, "1st nested", "2nd nested");
const parent = lines({ indent: '--' }, "1st parent", nested, "2nd parent");
console.log(parent);
// --1st parent
// --==1st nested
// --==2nd nested
// --2nd parent
```

By setting the `skipFirstLevelIndent` option, the lines-builder won't indent the direct lines of the lines-builder, 
only starting from the nested ones:

```typescript
const nested = lines(, "1st nested", "2nd nested");
const parent = lines({ skipFirstLevelIndent: true, indent: '--' }, "1st parent", nested, "2nd parent");
console.log(parent);
// 1st parent
// --1st nested
// --2nd nested
// 2nd parent
```

### Default options

As seen above, options can be set per each lines-builder, but if you want to use one set of options, 
per each lines-builder you will use, you can use the `setDefaultOptions` .

```typescript
import { lines, setDefaultOptions } from "lines-builder";

setDefaultOptions({ indent: "__" });

const nested = lines("1st nested", "2nd nested");
const parent = lines("1st parent", nested, "2nd parent");
console.log(parent);
// __1st parent
// ____1st nested
// ____2nd nested
// __2nd parent
```

Note that the default options can be reset to the [initial ones](src/index.ts#L20) with the `resetDefaultOptions` .

### EOL

To output/format the lines, the lines-builder will determine the appropriate EOL based on the platform used ( `\r\n` for Windows, `\n` for other OS).
If you need to set explicitly what EOL to use, pass it in any options:

```typescript
// IBM Mainframe EOL
const l = lines({ eol: "\025" }, "Hello", "World");
console.log(l);
// Hello\025World
```

### Filtering

The filter method can be used to filter in place - either to keep or remove lines matching a specific pattern.

```typescript
const l = lines("simple line", "# comment line", "other line");
// the following expression removes lines starting with #
l.filter(/^\s*#/, true);
console.log(l);
// simple line
// other line
```

The filter function accepts either
1. a `string`, what will be converted to a case-insensitive RegExp
1. a `RegExp`, what will be used as it is
1. a `type LineMatcher = (line: string, i: number) => boolean;` function, what should return `true` in case of a match.

The filter function, based on the `reverse` parameter
1. if `false`, it keeps the line if the matcher is `true`; otherwise, it removes it
1. if `true`, it removes the line if the matcher is `true`; otherwise, it removes it

In the case of nested lines-builder, the same matcher and parameter are applied, and the nested one is kept if it contains any line after the filter.

## Other

For detailed documentation see the [TypeDocs documentation](https://szikszail.github.io/lines-builder/).

This package uses [debug](https://www.npmjs.com/package/debug) for logging, use `lines-builder` to see debug logs:

```shell
DEBUG=lines-builder node my-script.js
```
