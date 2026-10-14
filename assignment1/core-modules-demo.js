const os = require("os");
const path = require("path");
const fs = require("fs");

const sampleFilesDir = path.join(__dirname, "sample-files");
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
const platform = os.platform();
const cpu = os.cpus()[0].model;
const memory = os.totalmem();
console.log("Platform:", platform);
console.log("CPU:", cpu);
console.log("Total Memory:", memory);
// Path module
const directory = __dirname;
const filePath = path.join(directory, "sample-files", "demo.txt");
console.log("Joined path:", filePath);
// fs.promises API
async function fileWriteRead() {
  try {
    await fs.promises.writeFile(filePath, "Hello from fs.promises!");

    const content = await fs.promises.readFile(filePath, "utf-8");
    console.log("fs.promises read:", content);
  } catch (err) {
    console.log("File operation failed:", err.message);
  }
}
fileWriteRead();
// Streams for large files- log first 40 chars of each chunk
