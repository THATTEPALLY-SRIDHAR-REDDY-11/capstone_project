export function notFound(req, res, next) {
  next(Object.assign(new Error(`Route not found: ${req.originalUrl}`), { status: 404 }));
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  res.status(status).json({
    message: status === 500 ? "Internal server error" : err.message,
    errors: err.errors,
    details: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
}
