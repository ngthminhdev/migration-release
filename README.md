# migration-release

> [English](#english) | [Tiếng Việt](#tiếng-việt)

---

## English

A CLI tool to automatically generate release notes and migration guides from JSON files.

### Description

`migration-release` is a set of CLI tools that help manage and generate documentation for project releases. This tool:

- Reads release information from JSON files
- Automatically generates release notes in Markdown format
- Creates migration guides between versions
- Compares and tracks changes in runtime, environment variables, and scripts

### System Requirements

- Node.js >= 14

### Installation

```bash
npm install migration-release
```

Or install globally:

```bash
npm install -g migration-release
```

### Project Structure

The tool requires release files to be stored in the `releases/` directory with the following format:

```
releases/
  ├── 1.0.0.json
  ├── 1.1.0.json
  └── 2.0.0.json
```

#### Release JSON File Format

```json
{
  "version": "1.0.0",
  "date": "2025-01-15",
  "runtime": {
    "node": "18.0.0"
  },
  "tags": ["custom-tag"],
  "features": [
    "Added feature A"
  ],
  "bugfixes": [
    "Fixed critical bug in module B"
  ],
  "improvements": [
    "Improved performance for module C"
  ],
  "security": [
    "Fixed security vulnerability CVE-2025-XXXX"
  ],
  "breakingChanges": [
    "API endpoint /old-path has been removed"
  ],
  "deprecated": [
    "Function oldMethod() is deprecated, use newMethod() instead"
  ],
  "env": [
    {
      "key": "DATABASE_URL",
      "required": true,
      "default": "postgresql://localhost:5432/mydb",
      "description": "Database connection URL"
    }
  ],
  "scripts": [
    {
      "id": "migration-001",
      "title": "Update database schema",
      "steps": [
        "First, backup your database",
        {
          "type": "bash",
          "contents": [
            "npm install",
            "npm run migrate"
          ]
        },
        "Verify migration results"
      ]
    }
  ]
}
```

**Supported Sections:**
- `features`: New features added
- `bugfixes`: Bug fixes
- `improvements`: Performance or quality improvements
- `security`: Security updates
- `breakingChanges`: Breaking changes
- `deprecated`: Deprecated features
- `tags`: Custom tags (optional, auto-generated if not provided)

**Script Steps Format:**
The `steps` array in scripts supports two formats:
1. **Text string**: Simple step description displayed as bullet point
2. **Code block object**: 
   - `type`: Language for syntax highlighting (bash, javascript, sql, python, etc.)
   - `contents`: Array of code lines

You can mix both formats freely in the same script.

### CLI Commands

#### 1. `gen-release` - Generate Release Notes

Create markdown documentation for a specific version.

```bash
gen-release <version> [outDir]
```

**Examples:**

```bash
# Generate release notes for v1.0.0
gen-release 1.0.0

# Generate and save to custom directory
gen-release 1.0.0 docs/releases
```

**Output:** Creates `changelog-md/1.0.0.md` containing full release information.

#### 2. `gen-migration` - Generate Migration Guide

Create documentation for upgrading from one version to another.

```bash
gen-migration <fromVersion> <toVersion> [outDir]
```

**Examples:**

```bash
# Generate upgrade guide from 1.0.0 to 2.0.0
gen-migration 1.0.0 2.0.0

# Save to custom directory
gen-migration 1.0.0 2.0.0 docs/migrations
```

**Output:** Creates `changelog-md/migrations/1.0.0-to-2.0.0.md` containing:
- Runtime changes (Node.js version)
- New environment variables to add
- Removed environment variables
- Modified environment variables
- Migration scripts to run

#### 3. `gen-migrations-all` - Generate All Migrations

Automatically create migration guides for all possible version pairs.

```bash
gen-migrations-all [outDir]
```

**Examples:**

```bash
# Generate all migrations
gen-migrations-all

# Save to custom directory
gen-migrations-all docs/migrations
```

**Output:** Creates migration files for every version pair (1.0.0→1.1.0, 1.0.0→2.0.0, 1.1.0→2.0.0, ...)

### Using as a Library

You can import and use functions in your code:

```javascript
import {
  readRelease,
  getAllVersions,
  diffReleases,
  diffToMarkdown,
  releaseToMarkdown
} from 'migration-release';

// Read release information
const release = readRelease('1.0.0');

// Get all versions
const versions = getAllVersions();

// Compare 2 releases
const fromRelease = readRelease('1.0.0');
const toRelease = readRelease('2.0.0');
const diff = diffReleases(fromRelease, toRelease);

// Convert to markdown
const releaseMd = releaseToMarkdown(release);
const migrationMd = diffToMarkdown(diff);
```

### API

#### `readRelease(version, releasesDir?)`

Read the JSON file of a release.

- **version**: Version to read (e.g., "1.0.0")
- **releasesDir**: Directory containing release files (default: "releases")

#### `getAllVersions(releasesDir?)`

Get list of all versions sorted by semver.

#### `diffReleases(fromRelease, toRelease)`

Compare 2 releases and return an object containing changes:
- `runtimeChanges`: Changes in Node.js version
- `envAdded`: New environment variables
- `envRemoved`: Removed environment variables
- `envChanged`: Modified environment variables
- `newScripts`: New migration scripts

#### `releaseToMarkdown(release)`

Convert release object to markdown format.

#### `diffToMarkdown(diff)`

Convert diff object to migration guide markdown.

#### `compareSemver(a, b)`

Compare 2 version strings according to semantic versioning standard.

#### `generateReleaseTags(release)`

Generate tags based on release content. Auto-detects:
- `feature` - if features exist
- `bugfix` - if bugfixes exist
- `improvement` - if improvements exist
- `security` - if security updates exist
- `breaking-change` - if breaking changes exist
- `deprecated` - if deprecated items exist

Returns array of tags including "release" as base tag.

#### `releaseToMarkdownFull(release)`

Generate full release notes with complete environment variable list.

#### `releaseToMarkdownChangelog(current, previous)`

Generate changelog showing only changes compared to previous version.

### Example Output

#### Release Notes (1.0.0.md)

```markdown
---
title: "v1.0.0"
date: "2025-01-15"
tags: ["release","feature","bugfix","security"]
---

## Release Information

- **Version**: `1.0.0`
- **Node**: `18.0.0`

## Features

- Added feature A

## Bug Fixes

- Fixed critical bug in module B

## Improvements

- Improved performance for module C

## Security

- Fixed security vulnerability CVE-2025-XXXX

## Environment Variables (complete list)

- `DATABASE_URL` (required) – default: `postgresql://localhost:5432/mydb` – Database connection URL
```

#### Migration Guide (1.0.0-to-2.0.0.md)

```markdown
---
title: "Upgrade 1.0.0 → 2.0.0"
tags: ["migration"]
---

Upgrade guide from `1.0.0` to `2.0.0`.

## Runtime

- NodeJS: `16.0.0` → `18.0.0`

## New Environment Variables

- `NEW_FEATURE_FLAG` (required) – default: `true` – Enable new feature

## Migration Scripts

### Update database schema

- Run command: npm run migrate
- Verify migration results
```

### License

ISC

### Author

nghtminhdev

---

## Tiếng Việt

Công cụ tự động tạo tài liệu release notes và migration guides từ các file JSON.

## Mô tả

`migration-release` là một bộ công cụ CLI giúp quản lý và tạo tài liệu cho các phiên bản phát hành (release) của dự án. Công cụ này:

- Đọc thông tin release từ các file JSON
- Tự động tạo release notes dưới dạng Markdown
- Tạo hướng dẫn migration giữa các phiên bản
- So sánh và theo dõi thay đổi về runtime, environment variables và scripts

## Yêu cầu hệ thống

- Node.js >= 14

## Cài đặt

```bash
npm install migration-release
```

Hoặc cài đặt global:

```bash
npm install -g migration-release
```

## Cấu trúc dự án

Công cụ yêu cầu các file release được lưu trong thư mục `releases/` với format:

```
releases/
  ├── 1.0.0.json
  ├── 1.1.0.json
  └── 2.0.0.json
```

### Format file release JSON

```json
{
  "version": "1.0.0",
  "date": "2025-01-15",
  "runtime": {
    "node": "18.0.0"
  },
  "tags": ["custom-tag"],
  "features": [
    "Thêm chức năng A"
  ],
  "bugfixes": [
    "Sửa lỗi nghiêm trọng ở module B"
  ],
  "improvements": [
    "Cải thiện performance cho module C"
  ],
  "security": [
    "Sửa lỗ hổng bảo mật CVE-2025-XXXX"
  ],
  "breakingChanges": [
    "API endpoint /old-path đã bị loại bỏ"
  ],
  "deprecated": [
    "Hàm oldMethod() đã bị deprecated, sử dụng newMethod() thay thế"
  ],
  "env": [
    {
      "key": "DATABASE_URL",
      "required": true,
      "default": "postgresql://localhost:5432/mydb",
      "description": "Đường dẫn kết nối database"
    }
  ],
  "scripts": [
    {
      "id": "migration-001",
      "title": "Cập nhật database schema",
      "steps": [
        "Đầu tiên, backup database",
        {
          "type": "bash",
          "contents": [
            "npm install",
            "npm run migrate"
          ]
        },
        "Kiểm tra kết quả migration"
      ]
    }
  ]
}
```

**Các phần hỗ trợ:**
- `features`: Tính năng mới
- `bugfixes`: Sửa lỗi
- `improvements`: Cải tiến hiệu suất hoặc chất lượng
- `security`: Cập nhật bảo mật
- `breakingChanges`: Thay đổi gây breaking
- `deprecated`: Tính năng đã deprecated
- `tags`: Tags tùy chỉnh (tùy chọn, tự động tạo nếu không cung cấp)

**Định dạng Script Steps:**
Mảng `steps` trong scripts hỗ trợ 2 định dạng:
1. **Chuỗi văn bản**: Mô tả bước đơn giản hiển thị dạng bullet point
2. **Object code block**: 
   - `type`: Ngôn ngữ để syntax highlighting (bash, javascript, sql, python, v.v.)
   - `contents`: Mảng các dòng code

Bạn có thể kết hợp tự do cả 2 định dạng trong cùng một script.

## Các lệnh CLI

### 1. `gen-release` - Tạo release notes

Tạo tài liệu markdown cho một phiên bản cụ thể.

```bash
gen-release <version> [outDir]
```

**Ví dụ:**

```bash
# Tạo release notes cho v1.0.0
gen-release 1.0.0

# Tạo và lưu vào thư mục tùy chỉnh
gen-release 1.0.0 docs/releases
```

**Kết quả:** Tạo file `changelog-md/1.0.0.md` chứa thông tin đầy đủ về release.

### 2. `gen-migration` - Tạo hướng dẫn migration

Tạo tài liệu hướng dẫn nâng cấp từ phiên bản này sang phiên bản khác.

```bash
gen-migration <fromVersion> <toVersion> [outDir]
```

**Ví dụ:**

```bash
# Tạo hướng dẫn upgrade từ 1.0.0 lên 2.0.0
gen-migration 1.0.0 2.0.0

# Lưu vào thư mục tùy chỉnh
gen-migration 1.0.0 2.0.0 docs/migrations
```

**Kết quả:** Tạo file `changelog-md/migrations/1.0.0-to-2.0.0.md` chứa:
- Thay đổi về runtime (Node.js version)
- Environment variables mới cần thêm
- Environment variables bị xóa
- Environment variables thay đổi giá trị
- Scripts migration cần chạy

### 3. `gen-migrations-all` - Tạo tất cả migrations

Tự động tạo migration guides cho tất cả các cặp phiên bản có thể.

```bash
gen-migrations-all [outDir]
```

**Ví dụ:**

```bash
# Tạo tất cả migrations
gen-migrations-all

# Lưu vào thư mục tùy chỉnh
gen-migrations-all docs/migrations
```

**Kết quả:** Tạo file migration cho mọi cặp phiên bản (1.0.0→1.1.0, 1.0.0→2.0.0, 1.1.0→2.0.0, ...)

## Sử dụng như một thư viện

Bạn có thể import và sử dụng các hàm trong code:

```javascript
import {
  readRelease,
  getAllVersions,
  diffReleases,
  diffToMarkdown,
  releaseToMarkdown
} from 'migration-release';

// Đọc thông tin release
const release = readRelease('1.0.0');

// Lấy tất cả các version
const versions = getAllVersions();

// So sánh 2 releases
const fromRelease = readRelease('1.0.0');
const toRelease = readRelease('2.0.0');
const diff = diffReleases(fromRelease, toRelease);

// Chuyển đổi sang markdown
const releaseMd = releaseToMarkdown(release);
const migrationMd = diffToMarkdown(diff);
```

## API

### `readRelease(version, releasesDir?)`

Đọc file JSON của một release.

- **version**: Phiên bản cần đọc (ví dụ: "1.0.0")
- **releasesDir**: Thư mục chứa các file release (mặc định: "releases")

### `getAllVersions(releasesDir?)`

Lấy danh sách tất cả các version được sắp xếp theo semver.

### `diffReleases(fromRelease, toRelease)`

So sánh 2 release và trả về object chứa các thay đổi:
- `runtimeChanges`: Thay đổi về Node.js version
- `envAdded`: Environment variables mới
- `envRemoved`: Environment variables bị xóa
- `envChanged`: Environment variables thay đổi
- `newScripts`: Scripts migration mới

### `releaseToMarkdown(release)`

Chuyển đổi object release thành markdown format.

### `diffToMarkdown(diff)`

Chuyển đổi object diff thành migration guide markdown.

### `compareSemver(a, b)`

So sánh 2 version strings theo chuẩn semantic versioning.

### `generateReleaseTags(release)`

Tạo tags dựa trên nội dung release. Tự động phát hiện:
- `feature` - nếu có features
- `bugfix` - nếu có bugfixes
- `improvement` - nếu có improvements
- `security` - nếu có cập nhật bảo mật
- `breaking-change` - nếu có breaking changes
- `deprecated` - nếu có mục deprecated

Trả về mảng các tags bao gồm "release" làm tag cơ bản.

### `releaseToMarkdownFull(release)`

Tạo release notes đầy đủ với danh sách hoàn chỉnh các environment variables.

### `releaseToMarkdownChangelog(current, previous)`

Tạo changelog chỉ hiển thị các thay đổi so với phiên bản trước.

## Ví dụ output

### Release notes (1.0.0.md)

```markdown
---
title: "v1.0.0"
date: "2025-01-15"
tags: ["release","feature","bugfix","security"]
---

## Release Information

- **Version**: `1.0.0`
- **Node**: `18.0.0`

## Features

- Thêm chức năng A

## Bug Fixes

- Sửa lỗi nghiêm trọng ở module B

## Improvements

- Cải thiện performance cho module C

## Security

- Sửa lỗ hổng bảo mật CVE-2025-XXXX

## Environment Variables (complete list)

- `DATABASE_URL` (required) – default: `postgresql://localhost:5432/mydb` – Đường dẫn kết nối database
```

### Migration guide (1.0.0-to-2.0.0.md)

```markdown
---
title: "Upgrade 1.0.0 → 2.0.0"
tags: ["migration"]
---

Upgrade guide from `1.0.0` to `2.0.0`.

## Runtime

- NodeJS: `16.0.0` → `18.0.0`

## New Environment Variables

- `NEW_FEATURE_FLAG` (required) – default: `true` – Enable new feature

## Migration Scripts

### Cập nhật database schema

- Chạy lệnh: npm run migrate
- Kiểm tra kết quả migration
```

## License

ISC

## Author

nghtminhdev
