#!/usr/bin/env bun
import { parseVPK } from "./parser.ts";
import { parseZip } from "./zip.ts";

function printUsage(): void {
  console.log("Usage: vpk-parser <file> [-o output.json]");
  console.log("");
  console.log("Arguments:");
  console.log("  <file>           Path to a VPK file (.vpk) or zip file (.zip)");
  console.log("");
  console.log("Options:");
  console.log("  -o, --output     Output file path (default: stdout)");
  console.log("  -h, --help       Show this help message");
  process.exit(1);
}

function isZipFile(path: string): boolean {
  return path.toLowerCase().endsWith(".zip");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    printUsage();
  }

  let inputPath: string | undefined;
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
      inputPath = arg;
    }
  }

  if (!inputPath) {
    console.error("Error: No input file specified");
    printUsage();
  }

  try {
    let result;
    let summary: string;

    if (isZipFile(inputPath)) {
      result = await parseZip(inputPath);
      const vpkCount = Object.keys(result.vpks).length;
      const totalFiles = Object.values(result.vpks).reduce(
        (sum, vpk) => sum + Object.keys(vpk.files).length,
        0
      );
      summary = `Parsed ${vpkCount} VPK(s) with ${totalFiles} total files`;
    } else {
      result = await parseVPK(inputPath);
      const fileCount = Object.keys(result.files).length;
      summary = `Parsed ${fileCount} files (${result.size} bytes)`;
    }

    const json = JSON.stringify(result, null, 2);

    if (outputPath) {
      await Bun.write(outputPath, json);
      console.log(summary);
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
