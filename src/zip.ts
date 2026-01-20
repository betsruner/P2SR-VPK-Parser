import { parseVPKFromBuffer } from "./parser.ts";
import type { VPKZipResult } from "./types.ts";

function isDirectoryVPK(filename: string): boolean {
  return filename.endsWith("_dir.vpk");
}

export async function parseZip(zipPath: string): Promise<VPKZipResult> {
  const file = Bun.file(zipPath);
  const arrayBuffer = await file.arrayBuffer();
  const zipData = new Uint8Array(arrayBuffer);

  const { unzipSync } = await import("fflate");
  const unzipped = unzipSync(zipData);

  const vpks: VPKZipResult["vpks"] = {};

  for (const [path, data] of Object.entries(unzipped)) {
    if (!isDirectoryVPK(path)) continue;

    try {
      const buffer = Buffer.from(data);
      const result = parseVPKFromBuffer(buffer, data.length);
      vpks[path] = result;
    } catch (error) {
      // Skip invalid VPK files silently
      console.error(`Warning: Failed to parse ${path}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  return { vpks };
}
