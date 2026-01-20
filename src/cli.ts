#!/usr/bin/env bun
import { parseVPK } from "./parser.ts";

function printUsage(): void {
  console.log("Usage: vpk-parser <vpk-file> [-o output.json]");
  console.log("");
  console.log("Arguments:");
  console.log("  <vpk-file>       Path to a VPK directory file (e.g., pak01_dir.vpk)");
  console.log("");
  console.log("Options:");
  console.log("  -o, --output     Output file path (default: stdout)");
  console.log("  -h, --help       Show this help message");
  process.exit(1);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    printUsage();
  }

  let vpkPath: string | undefined;
  let outputPath: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-o" || arg === "--output") {
      outputPath = args[++i];
      if (!outputPath) {
        console.error("Error: -o/--output requires a file path");
        process.exit(1);
      }
    } else if (!arg?.startsWith("-")) {
      vpkPath = arg;
    }
  }

  if (!vpkPath) {
    console.error("Error: No VPK file specified");
    printUsage();
  }

  try {
    const result = await parseVPK(vpkPath);
    const json = JSON.stringify(result, null, 2);

    if (outputPath) {
      await Bun.write(outputPath, json);
      const fileCount = Object.keys(result.files).length;
      console.log(`Parsed ${fileCount} files (${result.size} bytes)`);
      console.log(`Output written to: ${outputPath}`);
    } else {
      console.log(json);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("An unknown error occurred");
    }
    process.exit(1);
  }
}

main();
