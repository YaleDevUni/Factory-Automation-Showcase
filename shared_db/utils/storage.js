const path = require("path");

const repoRoot = path.resolve(__dirname, "..", "..");
const defaultStorage = path.join(repoRoot, "db", "fa.db");

const isWindows = process.platform === "win32";
const normalizePath = (targetPath) =>
  isWindows
    ? path.normalize(targetPath).toLowerCase()
    : path.normalize(targetPath);
const normalizedRoot = normalizePath(repoRoot);

const resolveStoragePath = (inputPath) => {
  if (!inputPath) {
    return defaultStorage;
  }

  if (path.isAbsolute(inputPath)) {
    return inputPath;
  }

  const resolved = path.resolve(repoRoot, inputPath);
  const normalizedResolved = normalizePath(resolved);

  if (!normalizedResolved.startsWith(normalizedRoot)) {
    // Prevent escaping the repository root when using relative paths.
    return defaultStorage;
  }

  return resolved;
};

module.exports = {
  defaultStorage,
  resolveStoragePath,
};
