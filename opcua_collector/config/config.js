const { resolveStoragePath } = require("../../shared_db/utils/storage");

const storage = resolveStoragePath(
  process.env.SHARED_DB_STORAGE || process.env.STORAGE || "db/fa.db"
);

module.exports = {
  development: {
    dialect: "sqlite",
    storage,
  },
  production: {
    dialect: "sqlite",
    storage,
  },
  test: {
    dialect: "sqlite",
    storage,
  },
};
