# Node.js Fundamentals

## What is Node.js?

Node.js is a runtime environment that allows you to run JavaScript outside of a web browser. It is commonly used to build backend applications, APIs, servers, and command-line tools.

## How does Node.js differ from running JavaScript in the browser?

Unlike JavaScript running in a browser, Node.js does not have access to the DOM or browser-specific APIs. Instead, Node provides APIs for things like working with files, the operating system, and network connections.

## What is the V8 engine, and how does Node use it?

V8 is a JavaScript engine developed by Google and used by the Chrome web browser to execute JavaScript. Node.js uses the V8 engine to run JavaScript outside of the browser and adds additional features for server-side development.

## What are some key use cases for Node.js?

Node.js can be used to create HTTP servers and web APIs that handle requests and send responses. It also provides modules such as the file system (fs) module, which allows applications to read, write, and manage files.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

CommonJS uses require() to import modules and module.exports to export them. It is the traditional module system used in Node.js.
ES Modules use import and export to share code between files. They are the standard JavaScript module system and are also commonly used in modern Node.js applications.

**CommonJS (default in Node.js):**

```js
// math.js
const add = (a, b) => a + b;
module.exports = { add };
// app.js
const { add } = require("./math");
console.log(add(2, 3));
```

**ES Modules (supported in modern Node.js):**

```js
// math.js
export const add = (a, b) => a + b;
// app.js
import { add } from "./math.js";
console.log(add(2, 3));
```
