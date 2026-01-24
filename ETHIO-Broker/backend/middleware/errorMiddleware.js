const notfound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorhandler = (err, req, res, next) => {
  // Duplicate key error (E11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists: ${err.keyValue[field]}`,
    });
  }

  // Validation errors (Mongoose schema validation)
  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: Object.values(err.errors)
        .map((val) => val.message)
        .join(", "),
    });
  }

  // Default server error
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Server Error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = {
  notfound,
  errorhandler,
};
