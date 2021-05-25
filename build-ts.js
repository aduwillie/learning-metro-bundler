const Path = require("path");
const Metro = require("metro");

Metro.loadConfig()
  .then((config) => {
    Metro.runBuild(config, {
      entry: Path.resolve(__dirname, "src/ts-react.tsx"),
      out: Path.resolve(__dirname, "dist/ts-react.bundle.js"),
      sourceMap: true
    });
  })
  .catch(console.err);
