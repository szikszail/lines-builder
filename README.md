# lines-builder

![Downloads](https://img.shields.io/npm/dw/lines-builder?style=flat-square) ![Version@npm](https://img.shields.io/npm/v/lines-builder?label=version%40npm&style=flat-square) ![Version@git](https://img.shields.io/github/package-json/v/szikszail/lines-builder/master?label=version%40git&style=flat-square) ![CI](https://img.shields.io/github/workflow/status/szikszail/lines-builder/CI/main?label=ci&style=flat-square) ![Docs](https://img.shields.io/github/workflow/status/szikszail/lines-builder/Docs/main?label=docs&style=flat-square)

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

### Append 

You can **append any lines**, including new line to the end (in place):
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

You can **prepend any lines**, including new-line to the beginning (in place):
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

You can also set a **number** as the indentation, in this case, the given number of spaces will be used.

### Trim

By default, lines-builder **trims** the leading and trailing **whitespaces**, but you can turn it off:
```typescript
const l = lines({ trim: false }, "Hello World  ", "  2nd line\n  3rd line");
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

## Other

For detailed documentation see the [TypeDocs documentation](https://szikszail.github.io/lines-builder/).

This package uses [debug](https://www.npmjs.com/package/debug) for logging, use `lines-builder` to see debug logs:

```shell
DEBUG=lines-builder node my-script.js
```
