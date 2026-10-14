const { resolve } = require("dns");
const fs = require("fs");
const path = require("path");

const directory = path.join(__dirname, "sample-files");
const filePath = path.join(directory, "sample.txt");

const fileContent = "Hello, async world!";

// Write a sample file for demonstration
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(filePath, fileContent);

// 1. Callback style
fs.readFile(filePath, "utf8", (err, content) => {
  if (err) {
    console.log("Could not read file: ", err.message);
  } else {
    console.log("Callback:", content);
  }
});

// Callback hell example (test and leave it in comments):
// fs.readFile(filePath, "utf8", (err, content) => {
//   if (err) {
//     console.log("file read failed: ", err.message);
//   } else {
//     console.log(content);
//
//     fs.readFile(filePath, "utf8", (err, content) => {
//       if (err) {
//         console.log("file read failed: ", err.message);
//       } else {
//         console.log(content);
//
//         fs.readFile(filePath, "utf8", (err, content) => {
//           if (err) {
//             console.log("file read failed: ", err.message);
//           } else {
//             console.log(content);
//           }
//         });
//       }
//     });
//   }
// });

// 2. Promise style
function readTextFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, "utf-8", (err, content) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(content);
    });
  });
}

readTextFile(filePath)
  .then((content) => {
    console.log("Promise:", content);
  })
  .catch((err) => {
    console.log("Fould not read file:", err.message);
  });

// 3. Async/Await style

async function readTextFileAsync(path) {
  try {
    const content = await readTextFile(path);
    console.log("Async/Await:", content);
  } catch (err) {
    console.log("Could not read file:", err.message);
  }
}

readTextFileAsync(filePath);
