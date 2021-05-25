const Path = require("path");
const Metro = require("metro");

Metro.loadConfig()
  .then((config) => {
    Metro.runBuild(config, {
      entry: Path.resolve(__dirname, "src/index.js"),
      out: Path.resolve(__dirname, "dist/index.bundle.js"),
      sourceMap: true
    });
  })
  .catch(console.err);
