export interface VPKHeader {
  signature: number;
  version: number;
  treeSize: number;
}

export interface VPKFileEntry {
  path: string;
  crc: number;
  preloadBytes: number;
  archiveIndex: number;
  offset: number;
  length: number;
  totalSize: number;
}

export interface VPKParseResult {
  version: number;
  treeSize: number;
  fileCount: number;
  files: VPKFileEntry[];
}

export const VPK_SIGNATURE = 0x55aa1234;
export const VPK_EMBEDDED_ARCHIVE = 0x7fff;
export const VPK_ENTRY_TERMINATOR = 0xffff;
