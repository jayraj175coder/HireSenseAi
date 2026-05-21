export function notFoundHandler(req, _res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const statusCode = error.statusCode || error.status || 500;
  const payload = {
    message: error.message || "Something went wrong",
    ...(process.env.NODE_ENV !== "production" && { stack: error.stack })
  };

  res.status(statusCode).json(payload);
}
