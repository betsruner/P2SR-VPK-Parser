import { unzipSync } from "fflate";
import { parseVPKFromBuffer } from "./parser.ts";
import type { VPKParseResult, VPKZipResult } from "./types.ts";

function isDirectoryVPK(filename: string): boolean {
  return filename.endsWith("_dir.vpk");
}

function isZipFile(filename: string): boolean {
  return filename.toLowerCase().endsWith(".zip");
}

function processZipData(
  zipData: Uint8Array,
  pathPrefix: string,
  vpks: Record<string, VPKParseResult>
): void {
  const unzipped = unzipSync(zipData);

  for (const [path, data] of Object.entries(unzipped)) {
    const fullPath = pathPrefix ? `${pathPrefix}/${path}` : path;

    if (isZipFile(path)) {
      // Recursively process nested zip
      try {
        processZipData(new Uint8Array(data), fullPath, vpks);
      } catch (error) {
        console.error(`Warning: Failed to extract nested zip ${fullPath}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    } else if (isDirectoryVPK(path)) {
      // Parse VPK
      try {
        const buffer = Buffer.from(data);
        const result = parseVPKFromBuffer(buffer, data.length);
        vpks[fullPath] = result;
      } catch (error) {
        console.error(`Warning: Failed to parse ${fullPath}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }
  }
}

export async function parseZip(zipPath: string): Promise<VPKZipResult> {
  const file = Bun.file(zipPath);
  const arrayBuffer = await file.arrayBuffer();
  const zipData = new Uint8Array(arrayBuffer);

  const vpks: VPKZipResult["vpks"] = {};
  processZipData(zipData, "", vpks);

  return { vpks };
}
