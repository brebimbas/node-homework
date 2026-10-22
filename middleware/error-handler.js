function errorHandler(err, req, res, next) {
  res.status(500).json({
    message: "Something went wrong.",
  });
  next();
}

module.exports = errorHandler;
