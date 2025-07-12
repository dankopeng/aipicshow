import { type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getFileFromR2 } from "~/utils/storage.server";

/**
 * GET /api/images/file/:filename - 獲取圖片文件
 */
export async function loader({ params, context }: LoaderFunctionArgs) {
  try {
    const { filename } = params;
    if (!filename) {
      return new Response("Filename is required", { status: 400 });
    }

    const key = `images/${filename}`;
    const bucket = context.cloudflare.env.IMAGES;
    const object = await getFileFromR2(bucket, key);

    if (!object) {
      return new Response("File not found", { status: 404 });
    }

    // 設置適當的內容類型和緩存控制頭
    const headers = new Headers();
    const contentType = object.httpMetadata?.contentType || "application/octet-stream";
    headers.set("Content-Type", contentType);
    headers.set("Cache-Control", "public, max-age=31536000"); // 1 年緩存
    headers.set("ETag", object.etag);

    return new Response(object.body, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error("Failed to get file:", error);
    return new Response("Failed to get file", { status: 500 });
  }
}
