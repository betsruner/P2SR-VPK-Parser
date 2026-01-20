export interface VPKParseResult {
  size: number;
  crc: string;
  files: Record<string, number>;
}

export interface VPKZipResult {
  vpks: Record<string, VPKParseResult>;
}

export const VPK_SIGNATURE = 0x55aa1234;
export const VPK_EMBEDDED_ARCHIVE = 0x7fff;
export const VPK_ENTRY_TERMINATOR = 0xffff;
