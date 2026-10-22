const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");

const dogsRouter = require("./routes/dogs");

const app = express();

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.startAt = Date.now();
  next();
});

// Assignment 3b and 3c ask you to add middleware in this file.
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", dogsRouter); // Do not remove this line

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;
