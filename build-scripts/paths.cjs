const path = require("path");

module.exports = {
  root_dir: path.resolve(__dirname, ".."),

  src_dir: path.resolve(__dirname, "../src"),

  build_dir: path.resolve(__dirname, "../insteon_frontend"),
  upstream_build_dir: path.resolve(__dirname, "../homeassistant-frontend/build"),
  app_output_root: path.resolve(__dirname, "../insteon_frontend"),
  app_output_static: path.resolve(__dirname, "../insteon_frontend/static"),
  app_output_latest: path.resolve(__dirname, "../insteon_frontend/frontend_latest"),
  app_output_es5: path.resolve(__dirname, "../insteon_frontend/frontend_es5"),

  insteon_dir: path.resolve(__dirname, ".."),
  insteon_output_root: path.resolve(__dirname, "../insteon_frontend"),
  insteon_output_static: path.resolve(__dirname, "../insteon_frontend/static"),
  insteon_output_latest: path.resolve(__dirname, "../insteon_frontend/frontend_latest"),
  insteon_output_es5: path.resolve(__dirname, "../insteon_frontend/frontend_es5"),
  insteon_publicPath: "/insteon_static",

  translations_src: path.resolve(__dirname, "../homeassistant-frontend/src/translations"),
};
