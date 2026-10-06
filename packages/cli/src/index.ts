#!/usr/bin/env node
import { Command } from "commander";
import { startProxy } from "@syncpane/proxy";

const CLI_NAME = "syncpane";
const CLI_DESCRIPTION = "Responsive web design testing CLI tool";
const CLI_VERSION = "0.0.1";

interface CliOptions {
  port: string;
}

const program = new Command();

program
  .name(CLI_NAME)
  .description(CLI_DESCRIPTION)
  .version(CLI_VERSION)
  .argument("<url>", "Target URL to proxy and test (e.g. http://localhost:5173)")
  .option("-p, --port <number>", "Port our proxy server will run on", "4000")
  .action(async (url: string, options: CliOptions) => {
    const portNumber = parseInt(options.port, 10);
    if (isNaN(portNumber)) {
      console.error(`Invalid port number: "${options.port}"`);
      process.exit(1);
    }

    console.log(`Starting responsive testing for ${url} on proxy port ${portNumber}...`);

    try {
      await startProxy(url, portNumber);
    } catch (err) {
      console.error("Failed to start proxy server:", err instanceof Error ? err.message : err);
      process.exit(1);
    }
  });

program.parse(process.argv);
