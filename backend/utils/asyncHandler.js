// Wraps an async route handler so any thrown error / rejected promise
// is automatically passed to next(error) -> our errorHandler middleware.
// This means controllers don't need try/catch around every DB call.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
