import {
  type VPKHeader,
  type VPKFileEntry,
  type VPKParseResult,
  VPK_SIGNATURE,
  VPK_ENTRY_TERMINATOR,
} from "./types.ts";

class BinaryReader {
  private buffer: Buffer;
  private offset: number = 0;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  get position(): number {
    return this.offset;
  }

  readUInt32(): number {
    const value = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return value;
  }

  readUInt16(): number {
    const value = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return value;
  }

  readNullTerminatedString(): string {
    let result = "";
    while (this.offset < this.buffer.length) {
      const char = this.buffer[this.offset++];
      if (char === 0) break;
      result += String.fromCharCode(char!);
    }
    return result;
  }

  skip(bytes: number): void {
    this.offset += bytes;
  }
}

function buildFilePath(extension: string, path: string, filename: string): string {
  const ext = extension === " " ? "" : extension;
  const dir = path === " " ? "" : path;
  const name = filename === " " ? "" : filename;

  let fullPath = "";
  if (dir) {
    fullPath = dir + "/";
  }
  fullPath += name;
  if (ext) {
    fullPath += "." + ext;
  }
  return fullPath;
}

export async function parseVPK(filePath: string): Promise<VPKParseResult> {
  const file = Bun.file(filePath);
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const reader = new BinaryReader(buffer);

  // Read header
  const signature = reader.readUInt32();
  if (signature !== VPK_SIGNATURE) {
    throw new Error(
      `Invalid VPK signature: expected 0x${VPK_SIGNATURE.toString(16)}, got 0x${signature.toString(16)}`
    );
  }

  const version = reader.readUInt32();
  if (version !== 1 && version !== 2) {
    throw new Error(`Unsupported VPK version: ${version}. Only version 1 and 2 are supported.`);
  }

  const treeSize = reader.readUInt32();

  // Skip additional v2 header fields if present
  if (version === 2) {
    reader.skip(16); // FileDataSectionSize, ArchiveMD5SectionSize, OtherMD5SectionSize, SignatureSectionSize
  }

  const header: VPKHeader = { signature, version, treeSize };
  const files: VPKFileEntry[] = [];

  // Parse directory tree
  // Structure: Extension -> Path -> Filename -> Entry
  while (true) {
    const extension = reader.readNullTerminatedString();
    if (extension === "") break;

    while (true) {
      const path = reader.readNullTerminatedString();
      if (path === "") break;

      while (true) {
        const filename = reader.readNullTerminatedString();
        if (filename === "") break;

        // Read file entry (18 bytes)
        const crc = reader.readUInt32();
        const preloadBytes = reader.readUInt16();
        const archiveIndex = reader.readUInt16();
        const offset = reader.readUInt32();
        const length = reader.readUInt32();
        const terminator = reader.readUInt16();

        if (terminator !== VPK_ENTRY_TERMINATOR) {
          throw new Error(
            `Invalid entry terminator: expected 0x${VPK_ENTRY_TERMINATOR.toString(16)}, got 0x${terminator.toString(16)}`
          );
        }

        // Skip preload data
        if (preloadBytes > 0) {
          reader.skip(preloadBytes);
        }

        const fullPath = buildFilePath(extension, path, filename);
        const totalSize = preloadBytes + length;

        files.push({
          path: fullPath,
          crc,
          preloadBytes,
          archiveIndex,
          offset,
          length,
          totalSize,
        });
      }
    }
  }

  return {
    version: header.version,
    treeSize: header.treeSize,
    fileCount: files.length,
    files,
  };
}
