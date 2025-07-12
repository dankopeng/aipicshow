import { nanoid } from 'nanoid';

// 生成唯一的文件名
export function generateUniqueFileName(originalName: string): string {
  const extension = originalName.split('.').pop() || '';
  const uniqueId = nanoid();
  return `${uniqueId}.${extension}`;
}

// 獲取文件的 MIME 類型
export function getMimeType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

// 上傳文件到 R2 存儲
export async function uploadFileToR2(
  bucket: R2Bucket,
  fileData: ArrayBuffer,
  fileName: string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const key = `images/${fileName}`;
  
  await bucket.put(key, fileData, {
    httpMetadata: {
      contentType
    }
  });
  
  // 在實際生產環境中，您可能需要使用 Cloudflare 的公共 URL 或自定義域名
  const url = `/api/images/file/${fileName}`;
  
  return { key, url };
}

// 從 R2 存儲刪除文件
export async function deleteFileFromR2(bucket: R2Bucket, key: string): Promise<boolean> {
  try {
    await bucket.delete(key);
    return true;
  } catch (error) {
    console.error('Failed to delete file from R2:', error);
    return false;
  }
}

// 從 R2 存儲獲取文件
export async function getFileFromR2(bucket: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  try {
    const object = await bucket.get(key);
    return object;
  } catch (error) {
    console.error('Failed to get file from R2:', error);
    return null;
  }
}
