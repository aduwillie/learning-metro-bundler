const Metro = require("metro");

const run = async () => {
  const config = await Metro.loadConfig();
  await Metro.runServer(config, {
    port: 8080,
  });
};

run();
