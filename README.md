# vpk-parser

A CLI tool to parse Valve VPK (Valve Pak) files and output file listings as JSON.

## Features

- Parse VPK v1 and v2 files (Portal 2, TF2, CS:GO, etc.)
- Extract file listings with CRC checksums
- Process zip archives containing VPK files
- Recursively search nested zip files for VPKs

## Installation

Requires [Bun](https://bun.sh/) runtime.

```bash
bun install
```

## Usage

```bash
# Parse a single VPK file
bun run src/cli.ts pak01_dir.vpk

# Parse and save to file
bun run src/cli.ts pak01_dir.vpk -o output.json

# Parse a zip containing VPK files
bun run src/cli.ts game_files.zip -o output.json
```

## Output Format

### Single VPK file

```json
{
  "size": 1234567,
  "crc": "a8b3c2d1",
  "files": {
    "materials/brick/brickwall001.vmt": 2834927493,
    "models/props/chair.mdl": 1928374650
  }
}
```

### Zip file with VPKs

```json
{
  "vpks": {
    "portal2/pak01_dir.vpk": {
      "size": 1234567,
      "crc": "a8b3c2d1",
      "files": {
        "materials/brick/brickwall001.vmt": 2834927493
      }
    },
    "portal2_dlc1/pak01_dir.vpk": {
      "size": 456789,
      "crc": "f1e2d3c4",
      "files": {
        "models/props/new_prop.mdl": 987654321
      }
    }
  }
}
```

## Output Fields

- `size` - Size of the VPK directory file in bytes
- `crc` - CRC32 checksum of the VPK file (hex string)
- `files` - Map of file paths to their CRC32 checksums (numeric)

## Notes

- Only `*_dir.vpk` files are parsed (directory VPKs)
- Archive VPKs (`*_000.vpk`, `*_001.vpk`, etc.) are ignored
- Nested zip files are searched recursively
