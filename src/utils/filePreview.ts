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
  | 'csv'
  | 'json'
  | 'xml'
  | 'readability'
  | 'unknown'
  | 'embed'
  | 'gist'
  | 'stackoverflow'
  | 'googleViewer'
  | 'drawio';

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
  'avif': 'image', 'tiff': 'image', 'tif': 'image', 'heic': 'image',
  'heif': 'image', 'raw': 'image', 'cr2': 'image', 'nef': 'image',

  // 视频
  'mp4': 'video', 'webm': 'video', 'ogg': 'video', 'mov': 'video',
  'avi': 'video', 'mkv': 'video', 'flv': 'video', 'wmv': 'video',
  'm4v': 'video', '3gp': 'video', 'mpg': 'video', 'mpeg': 'video',

  // 音频
  'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio',
  'm4a': 'audio', 'wma': 'audio', 'oga': 'audio', 'opus': 'audio',
  'aiff': 'audio', 'au': 'audio',

  // Office - Excel
  'xlsx': 'xlsx', 'xls': 'xls', 'xlsm': 'xlsx', 'xlsb': 'xlsx',
  'xltx': 'xlsx', 'xlt': 'xls', 'ods': 'xlsx',

  // Office - Word
  'docx': 'docx', 'doc': 'doc', 'docm': 'docx', 'dotx': 'docx',
  'dot': 'doc', 'odt': 'docx', 'rtf': 'docx',

  // Office - PowerPoint
  'pptx': 'pptx', 'ppt': 'ppt', 'pptm': 'pptx', 'potx': 'pptx',
  'pot': 'ppt', 'odp': 'pptx',

  // Google Docs Viewer 支持的其他格式
  'psd': 'googleViewer', 'ai': 'googleViewer', 'dxf': 'googleViewer',
  'eps': 'googleViewer', 'ps': 'googleViewer',
  'ttf': 'googleViewer',
  'xps': 'googleViewer',
  'zip': 'googleViewer', 'rar': 'googleViewer',
  'pages': 'googleViewer',

  // draw.io
  'drawio': 'drawio',

  // Markdown
  'md': 'markdown', 'markdown': 'markdown', 'mdown': 'markdown',
  'mkd': 'markdown', 'mdx': 'markdown', 'mdwn': 'markdown',

  // 数据文件
  'csv': 'csv', 'tsv': 'csv', 'json': 'json', 'jsonl': 'json',
  'xml': 'xml', 'xsl': 'xml', 'xsd': 'xml', 'rss': 'xml',
  'atom': 'xml',

  // 代码文件
  'js': 'code', 'ts': 'code', 'jsx': 'code', 'tsx': 'code',
  'html': 'code', 'htm': 'code', 'css': 'code', 'scss': 'code', 'less': 'code',
  'yaml': 'code', 'yml': 'code', 'py': 'code', 'java': 'code', 
  'c': 'code', 'cpp': 'code', 'h': 'code', 'hpp': 'code',
  'cs': 'code', 'go': 'code', 'rs': 'code', 'rb': 'code', 'php': 'code',
  'sh': 'code', 'bash': 'code', 'sql': 'code', 'r': 'code',
  'swift': 'code', 'kt': 'code', 'lua': 'code', 'pl': 'code',
  'txt': 'code', 'log': 'code', 'ini': 'code', 'conf': 'code',
  'env': 'code', 'toml': 'code', 'lock': 'code', 'gitignore': 'code',
  'dockerfile': 'code', 'makefile': 'code', 'cmake': 'code',
  'vue': 'code', 'svelte': 'code', 'astro': 'code',
  'dart': 'code', 'scala': 'code', 'clj': 'code', 'elm': 'code',
  'haskell': 'code', 'hs': 'code', 'ml': 'code', 'fs': 'code',
  'vb': 'code', 'pas': 'code', 'asm': 'code', 's': 'code',
};

// MIME 类型到文件类型的映射
const mimeTypeMap: Record<string, FileType> = {
  'application/pdf': 'pdf',

  'image/jpeg': 'image', 'image/png': 'image', 'image/gif': 'image',
  'image/bmp': 'image', 'image/webp': 'image', 'image/svg+xml': 'image',
  'image/x-icon': 'image', 'image/avif': 'image', 'image/tiff': 'image',
  'image/heic': 'image', 'image/heif': 'image',

  'video/mp4': 'video', 'video/webm': 'video', 'video/ogg': 'video',
  'video/quicktime': 'video', 'video/x-msvideo': 'video',
  'video/x-flv': 'video', 'video/x-ms-wmv': 'video',

  'audio/mpeg': 'audio', 'audio/wav': 'audio', 'audio/flac': 'audio',
  'audio/aac': 'audio', 'audio/ogg': 'audio', 'audio/mp4': 'audio',
  'audio/opus': 'audio', 'audio/x-aiff': 'audio',

  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.oasis.opendocument.spreadsheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.oasis.opendocument.text': 'docx',
  'application/rtf': 'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.oasis.opendocument.presentation': 'pptx',

  'text/markdown': 'markdown', 'text/x-markdown': 'markdown',

  'text/csv': 'csv', 'application/csv': 'csv',
  'application/json': 'json', 'text/json': 'json',
  'application/xml': 'xml', 'text/xml': 'xml',
  'application/rss+xml': 'xml', 'application/atom+xml': 'xml',

  'text/plain': 'code', 'text/html': 'code', 'text/css': 'code',
  'text/javascript': 'code', 'application/javascript': 'code',
  'text/x-python': 'code', 'text/x-java': 'code',
  'application/x-yaml': 'code', 'text/yaml': 'code',
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
 * 从 Google Docs / MS Online 等预览 URL 中提取真实文件 URL
 * 已是真实 URL 则原样返回
 */
export function extractRealUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Google Docs Viewer: https://docs.google.com/viewer?url=<encoded_url>
    if (urlObj.hostname === 'docs.google.com' && urlObj.pathname.startsWith('/viewer')) {
      const realUrl = urlObj.searchParams.get('url');
      if (realUrl) return decodeURIComponent(realUrl);
    }

    // MS Office Online: https://view.officeapps.live.com/op/view.aspx?src=<encoded_url>
    if (urlObj.hostname === 'view.officeapps.live.com' || urlObj.hostname === 'onenote.officeapps.live.com') {
      const realUrl = urlObj.searchParams.get('src');
      if (realUrl) return decodeURIComponent(realUrl);
    }

    // Google Docs native URLs (docs.google.com/spreadsheets/d/..., etc.)
    const nativeMatch = url.match(/docs\.google\.com\/(spreadsheets|document|presentation)\/d\/([^/]+)/);
    if (nativeMatch) {
      const [, type, docId] = nativeMatch;
      const exportFormats: Record<string, string> = {
        spreadsheets: 'xlsx',
        document: 'docx',
        presentation: 'pptx',
      };
      const ext = exportFormats[type] || 'xlsx';
      return `https://docs.google.com/${type}/d/${docId}/export?format=${ext}`;
    }
  } catch {
    // ignore
  }
  return url;
}

/**
 * 预处理预览 URL，处理特殊平台的 URL 转换
 * 1. GitHub blob URL -> raw.githubusercontent.com
 * 2. GitHub raw URL -> 直接使用
 * 3. GitLab blob URL -> raw URL
 * 4. Qiita 文章 .md URL 直接返回 markdown，无需转换
 * 5. YouTube / Bilibili / Vimeo -> embed URL
 * 6. GitHub Gist -> raw URL
 * 7. Stack Overflow -> API URL
 * 8. CodePen -> embed URL
 * 9. JSFiddle -> embed URL
 * 10. Google Drive -> direct download URL
 * 11. Google Docs / MS Online viewer URL -> 提取真实 URL
 */
export function preprocessPreviewUrl(url: string): string {
  try {
    // 先从 viewer URL 中提取真实文件 URL
    const realUrl = extractRealUrl(url);
    if (realUrl !== url) return preprocessPreviewUrl(realUrl);

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

    // 2. GitHub raw URL 直接返回（已是最优格式）
    if (urlObj.hostname === 'raw.githubusercontent.com') {
      return url;
    }

    // 3. GitLab blob URL 转 raw URL
    // https://gitlab.com/{user}/{repo}/-/blob/{branch}/{path} -> https://gitlab.com/{user}/{repo}/-/raw/{branch}/{path}
    if ((urlObj.hostname === 'gitlab.com' || urlObj.hostname.endsWith('.gitlab.io')) && urlObj.pathname.includes('/-/blob/')) {
      return url.replace('/-/blob/', '/-/raw/');
    }

    // 4. Qiita 文章 URL 转 API URL，通过 FETCH_PROXY 获取 markdown
    // https://qiita.com/{user}/items/{id} -> https://qiita.com/api/v2/items/{id}
    // https://qiita.com/{user}/items/{id}.md -> https://qiita.com/api/v2/items/{id}
    if (urlObj.hostname === 'qiita.com') {
      const match = urlObj.pathname.match(/^\/([^\/]+)\/items\/([^\/?#]+)/);
      if (match) {
        const itemId = match[2].replace(/\.md$/i, '');
        return `https://qiita.com/api/v2/items/${itemId}`;
      }
    }

    // 5. YouTube URL 转 embed URL
    // https://youtube.com/watch?v={id} / https://youtu.be/{id} -> https://www.youtube.com/embed/{id}
    // 注意: 必须带上 origin 参数，否则 YouTube 会报错误 153
    const origin = typeof location !== 'undefined' ? location.origin : 'chrome-extension://';
    const youtubeEmbedParams = `enablejsapi=1&rel=0&modestbranding=1&origin=${encodeURIComponent(origin)}`;

    if (urlObj.hostname === 'youtube.com' || urlObj.hostname === 'www.youtube.com') {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?${youtubeEmbedParams}`;
      }
    }
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.replace(/^\//, '').split('?')[0];
      if (videoId) {
        return `https://www.youtube-nocookie.com/embed/${videoId}?${youtubeEmbedParams}`;
      }
    }

    // 6. Bilibili URL 转 embed URL
    // https://bilibili.com/video/BV{id} / https://www.bilibili.com/video/BV{id} -> https://player.bilibili.com/player.html?bvid=BV{id}
    if (urlObj.hostname === 'bilibili.com' || urlObj.hostname === 'www.bilibili.com') {
      const match = urlObj.pathname.match(/\/video\/(BV[^\/?#]+)/);
      if (match) {
        return `https://player.bilibili.com/player.html?bvid=${match[1]}&autoplay=0`;
      }
    }

    // 7. Vimeo URL 转 embed URL
    // https://vimeo.com/{id} -> https://player.vimeo.com/video/{id}
    if (urlObj.hostname === 'vimeo.com') {
      const match = urlObj.pathname.match(/^\/([0-9]+)/);
      if (match) {
        return `https://player.vimeo.com/video/${match[1]}?autoplay=0`;
      }
    }

    // 8. GitHub Gist URL 转 raw URL
    // https://gist.github.com/{user}/{gistId} -> https://gist.githubusercontent.com/{user}/{gistId}/raw
    if (urlObj.hostname === 'gist.github.com') {
      const match = urlObj.pathname.match(/^\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, user, gistId] = match;
        return `https://gist.githubusercontent.com/${user}/${gistId}/raw`;
      }
    }

    // 9. Stack Overflow URL 转 API URL
    // https://stackoverflow.com/questions/{id}/... -> https://api.stackexchange.com/2.3/questions/{id}?site=stackoverflow&filter=withbody
    if (urlObj.hostname === 'stackoverflow.com') {
      const match = urlObj.pathname.match(/^\/questions\/([0-9]+)/);
      if (match) {
        const questionId = match[1];
        return `https://api.stackexchange.com/2.3/questions/${questionId}?site=stackoverflow&filter=withbody`;
      }
    }

    // 10. CodePen URL 转 embed URL
    // https://codepen.io/{user}/pen/{penId} -> https://codepen.io/{user}/embed/{penId}
    if (urlObj.hostname === 'codepen.io') {
      const match = urlObj.pathname.match(/^\/([^\/]+)\/pen\/([^\/]+)/);
      if (match) {
        const [, user, penId] = match;
        return `https://codepen.io/${user}/embed/${penId}`;
      }
    }

    // 11. JSFiddle URL 转 embed URL
    // https://jsfiddle.net/{user}/{fiddleId} -> https://jsfiddle.net/{user}/{fiddleId}/embedded/
    if (urlObj.hostname === 'jsfiddle.net') {
      const match = urlObj.pathname.match(/^\/([^\/]+)\/([^\/]+)/);
      if (match && !urlObj.pathname.includes('/embedded/')) {
        const [, user, fiddleId] = match;
        return `https://jsfiddle.net/${user}/${fiddleId}/embedded/`;
      }
    }

    // 12. Google Drive 文件 URL 转直接下载 URL
    // https://drive.google.com/file/d/{fileId}/view -> https://drive.google.com/uc?id={fileId}&export=download
    if (urlObj.hostname === 'drive.google.com') {
      const match = urlObj.pathname.match(/\/file\/d\/([^\/]+)/);
      if (match) {
        const fileId = match[1];
        return `https://drive.google.com/uc?id=${fileId}&export=download`;
      }
    }

    // 13. Dropbox 分享链接转直接下载链接
    // https://www.dropbox.com/s/{id}/{filename}?dl=0 -> https://www.dropbox.com/s/{id}/{filename}?dl=1
    if (urlObj.hostname === 'www.dropbox.com' || urlObj.hostname === 'dropbox.com') {
      if (urlObj.searchParams.get('dl') === '0') {
        urlObj.searchParams.set('dl', '1');
        return urlObj.toString();
      }
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

  try {
    const urlObj = new URL(url);

    // 检查是否为 Qiita API URL（由 preprocessPreviewUrl 转换而来）
    if (urlObj.hostname === 'qiita.com' && urlObj.pathname.startsWith('/api/v2/items/')) {
      return { type: 'markdown', url, extension: 'md' };
    }

    // 检查是否为 Stack Overflow API URL
    if (urlObj.hostname === 'api.stackexchange.com') {
      return { type: 'stackoverflow', url, extension: 'stackoverflow' };
    }

    // 检查是否为 GitHub Gist raw URL
    if (urlObj.hostname === 'gist.githubusercontent.com') {
      return { type: 'gist', url, extension: 'gist' };
    }

    // 检查嵌入式视频平台
    if ((urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'www.youtube-nocookie.com') && urlObj.pathname.startsWith('/embed/')) {
      return { type: 'embed', url, extension: 'youtube' };
    }
    if (urlObj.hostname === 'player.bilibili.com') {
      return { type: 'embed', url, extension: 'bilibili' };
    }
    if (urlObj.hostname === 'player.vimeo.com') {
      return { type: 'embed', url, extension: 'vimeo' };
    }
    if (urlObj.hostname === 'codepen.io' && urlObj.pathname.includes('/embed/')) {
      return { type: 'embed', url, extension: 'codepen' };
    }
    if (urlObj.hostname === 'jsfiddle.net' && urlObj.pathname.includes('/embedded/')) {
      return { type: 'embed', url, extension: 'jsfiddle' };
    }

    // 检查 Google Drive 文件
    if (urlObj.hostname === 'drive.google.com') {
      // 尝试从 URL 参数中获取文件类型信息
      const exportParam = urlObj.searchParams.get('export');
      if (exportParam === 'download') {
        return { type: 'unknown', url, extension: '' }; // 需要下载后才能确定类型
      }
    }

    // 检查 raw.githubusercontent.com 文件
    if (urlObj.hostname === 'raw.githubusercontent.com') {
      const extension = getExtensionFromUrl(url);
      if (extension && extensionMap[extension]) {
        return { type: extensionMap[extension], url, extension };
      }
      // 如果没有扩展名，尝试根据路径判断
      if (urlObj.pathname.includes('README') || urlObj.pathname.toLowerCase().includes('.md')) {
        return { type: 'markdown', url, extension: 'md' };
      }
      return { type: 'code', url, extension: 'txt' };
    }

    // 检查 GitLab raw 文件
    if ((urlObj.hostname === 'gitlab.com' || urlObj.hostname.endsWith('.gitlab.io')) && urlObj.pathname.includes('/-/raw/')) {
      const extension = getExtensionFromUrl(url);
      if (extension && extensionMap[extension]) {
        return { type: extensionMap[extension], url, extension };
      }
      return { type: 'code', url, extension: 'txt' };
    }
  } catch {
    // ignore URL parsing errors
  }

  // 基于文件扩展名检测
  const extension = getExtensionFromUrl(url);
  if (extension && extensionMap[extension]) {
    return { type: extensionMap[extension], url, extension };
  }

  // 检查 Office 文档 URL 模式
  for (const pattern of officeViewerPatterns) {
    if (pattern.test(url)) {
      if (/spreadsheets|excel|\.xls/i.test(url)) return { type: 'xlsx', url, extension: 'xlsx' };
      if (/document|word|\.doc/i.test(url)) return { type: 'docx', url, extension: 'docx' };
      if (/presentation|powerpoint|\.ppt/i.test(url)) return { type: 'pptx', url, extension: 'pptx' };
    }
  }

  // 检查 URL 参数中的文件扩展名
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

  // 基于 URL 路径模式的启发式检测
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    // 检查是否包含常见的文档关键词
    if (pathname.includes('readme') || pathname.includes('doc') || pathname.includes('manual')) {
      return { type: 'markdown', url, extension: 'md' };
    }
    
    // 检查是否是 API 端点
    if (pathname.includes('/api/') || pathname.includes('.json')) {
      return { type: 'json', url, extension: 'json' };
    }
    
    // 检查是否是 RSS/XML feed
    if (pathname.includes('rss') || pathname.includes('feed') || pathname.includes('.xml')) {
      return { type: 'xml', url, extension: 'xml' };
    }
    
    // 检查是否是文章类URL（使用Readability）
    if (pathname.includes('/article/') || pathname.includes('/post/') || pathname.includes('/blog/') || pathname.includes('/news/')) {
      return { type: 'readability', url, extension: 'html' };
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
    'googleViewer': 'Google Docs Viewer',
    'drawio': 'Draw.io',
    'code': 'Code/Text',
    'csv': 'CSV Data',
    'json': 'JSON Data',
    'xml': 'XML Data',
    'readability': 'Article',
    'unknown': 'Unknown',
    'embed': 'Embed Video',
    'gist': 'GitHub Gist',
    'stackoverflow': 'Stack Overflow',
  };
  return displayNames[fileType] || 'Unknown';
}
