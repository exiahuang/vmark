export type FileType =
  | 'pdf'
  | 'image'
  | 'video'
  | 'audio'
  | 'xlsx'
  | 'xls'
  | 'docx'
  | 'doc'
  | 'pptx'
  | 'ppt'
  | 'markdown'
  | 'code'
  | 'unknown';

export interface FilePreviewInfo {
  type: FileType;
  url: string;
  extension: string;
  mimeType?: string;
}

// 文件扩展名到类型的映射
const extensionMap: Record<string, FileType> = {
  // PDF
  'pdf': 'pdf',

  // 图片
  'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
  'bmp': 'image', 'webp': 'image', 'svg': 'image', 'ico': 'image',
  'avif': 'image', 'tiff': 'image', 'tif': 'image',

  // 视频
  'mp4': 'video', 'webm': 'video', 'ogg': 'video', 'mov': 'video',
  'avi': 'video', 'mkv': 'video', 'flv': 'video', 'wmv': 'video',

  // 音频
  'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio',
  'm4a': 'audio', 'wma': 'audio', 'oga': 'audio',

  // Office - Excel
  'xlsx': 'xlsx', 'xls': 'xls',

  // Office - Word
  'docx': 'docx', 'doc': 'doc',

  // Office - PowerPoint
  'pptx': 'pptx', 'ppt': 'ppt',

  // Markdown
  'md': 'markdown', 'markdown': 'markdown', 'mdown': 'markdown',
  'mkd': 'markdown', 'mdx': 'markdown',

  // 代码文件
  'js': 'code', 'ts': 'code', 'jsx': 'code', 'tsx': 'code',
  'html': 'code', 'htm': 'code', 'css': 'code', 'scss': 'code', 'less': 'code',
  'json': 'code', 'xml': 'code', 'yaml': 'code', 'yml': 'code',
  'py': 'code', 'java': 'code', 'c': 'code', 'cpp': 'code', 'h': 'code',
  'cs': 'code', 'go': 'code', 'rs': 'code', 'rb': 'code', 'php': 'code',
  'sh': 'code', 'bash': 'code', 'sql': 'code', 'r': 'code',
  'swift': 'code', 'kt': 'code', 'lua': 'code', 'pl': 'code',
  'txt': 'code', 'log': 'code', 'ini': 'code', 'conf': 'code',
  'env': 'code', 'toml': 'code', 'lock': 'code',
};

// MIME 类型到文件类型的映射
const mimeTypeMap: Record<string, FileType> = {
  'application/pdf': 'pdf',

  'image/jpeg': 'image', 'image/png': 'image', 'image/gif': 'image',
  'image/bmp': 'image', 'image/webp': 'image', 'image/svg+xml': 'image',
  'image/x-icon': 'image', 'image/avif': 'image', 'image/tiff': 'image',

  'video/mp4': 'video', 'video/webm': 'video', 'video/ogg': 'video',
  'video/quicktime': 'video', 'video/x-msvideo': 'video',

  'audio/mpeg': 'audio', 'audio/wav': 'audio', 'audio/flac': 'audio',
  'audio/aac': 'audio', 'audio/ogg': 'audio', 'audio/mp4': 'audio',

  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',

  'text/markdown': 'markdown', 'text/x-markdown': 'markdown',

  'text/plain': 'code', 'text/html': 'code', 'text/css': 'code',
  'text/javascript': 'code', 'application/javascript': 'code',
  'application/json': 'code', 'application/xml': 'code',
  'text/x-python': 'code', 'text/x-java': 'code',
};

// 常见 Office 文档的 URL 模式
const officeViewerPatterns = [
  /docs\.google\.com\/spreadsheets/,
  /docs\.google\.com\/document/,
  /docs\.google\.com\/presentation/,
  /office\.live\.com\/.*\.xlsx/,
  /office\.live\.com\/.*\.docx/,
  /office\.live\.com\/.*\.pptx/,
];

function getExtensionFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || '';
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  } catch {
    return '';
  }
}

/**
 * 预处理预览 URL，处理特殊平台的 URL 转换
 * 1. GitHub blob URL -> raw.githubusercontent.com
 * 2. Qiita 文章 URL -> 添加 .md 后缀
 * 3. 已经是 Google Docs Viewer 的 URL 不做处理
 */
export function preprocessPreviewUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // 1. GitHub blob URL 转 raw URL
    // https://github.com/{user}/{repo}/blob/{branch}/{path} -> https://raw.githubusercontent.com/{user}/{repo}/{branch}/{path}
    if (urlObj.hostname === 'github.com' && urlObj.pathname.includes('/blob/')) {
      const match = urlObj.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
      if (match) {
        const [, user, repo, branch, path] = match;
        return `https://raw.githubusercontent.com/${user}/${repo}/${branch}/${path}`;
      }
    }

    // 2. Qiita 文章 URL 添加 .md 后缀尝试获取 markdown
    // https://qiita.com/{user}/items/{id} -> https://qiita.com/{user}/items/{id}.md
    if (urlObj.hostname === 'qiita.com') {
      const match = urlObj.pathname.match(/^\/([^/]+)\/items\/([^/]+)$/);
      if (match && !urlObj.pathname.endsWith('.md')) {
        return `https://qiita.com${match[0]}.md`;
      }
    }

    // 3. 已经是 Google Docs Viewer URL，直接返回
    if (urlObj.hostname === 'docs.google.com' && urlObj.pathname.startsWith('/viewer')) {
      return url;
    }

    return url;
  } catch {
    return url;
  }
}

export function detectFileType(url: string, mimeType?: string): FilePreviewInfo {
  if (mimeType && mimeTypeMap[mimeType]) {
    const type = mimeTypeMap[mimeType];
    return { type, url, extension: getExtensionFromUrl(url), mimeType };
  }

  const extension = getExtensionFromUrl(url);
  if (extension && extensionMap[extension]) {
    return { type: extensionMap[extension], url, extension };
  }

  for (const pattern of officeViewerPatterns) {
    if (pattern.test(url)) {
      if (/spreadsheets|excel|\.xls/.test(url)) return { type: 'xlsx', url, extension: 'xlsx' };
      if (/document|word|\.doc/.test(url)) return { type: 'docx', url, extension: 'docx' };
      if (/presentation|powerpoint|\.ppt/.test(url)) return { type: 'pptx', url, extension: 'pptx' };
    }
  }

  try {
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;
    for (const [, value] of searchParams.entries()) {
      const ext = getExtensionFromUrl(value);
      if (ext && extensionMap[ext]) {
        return { type: extensionMap[ext], url, extension: ext };
      }
    }
  } catch {
    // ignore
  }

  return { type: 'unknown', url, extension: '' };
}

export function isPreviewable(fileType: FileType): boolean {
  return fileType !== 'unknown';
}

export function getFileTypeDisplayName(fileType: FileType): string {
  const displayNames: Record<string, string> = {
    'pdf': 'PDF Document',
    'image': 'Image',
    'video': 'Video',
    'audio': 'Audio',
    'xlsx': 'Excel (XLSX)',
    'xls': 'Excel (XLS)',
    'docx': 'Word (DOCX)',
    'doc': 'Word (DOC)',
    'pptx': 'PowerPoint (PPTX)',
    'ppt': 'PowerPoint (PPT)',
    'markdown': 'Markdown',
    'code': 'Code/Text',
    'unknown': 'Unknown',
  };
  return displayNames[fileType] || 'Unknown';
}
