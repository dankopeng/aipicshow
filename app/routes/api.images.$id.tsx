import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getImageById, deleteImage } from "~/utils/db.server";
import { deleteFileFromR2 } from "~/utils/storage.server";

/**
 * GET /api/images/:id - 獲取單張圖片詳情
 */
export async function loader({ params, context }: LoaderFunctionArgs) {
  try {
    const { id } = params;
    if (!id) {
      return json({ error: "Image ID is required" }, { status: 400 });
    }

    const db = context.cloudflare.env.DB;
    const image = await getImageById(db, id);

    if (!image) {
      return json({ error: "Image not found" }, { status: 404 });
    }

    return json(image);
  } catch (error) {
    console.error("Failed to get image:", error);
    return json({ error: "Failed to get image" }, { status: 500 });
  }
}

/**
 * DELETE /api/images/:id - 刪除圖片
 */
export async function action({ request, params, context }: ActionFunctionArgs) {
  if (request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { id } = params;
    if (!id) {
      return json({ error: "Image ID is required" }, { status: 400 });
    }

    const db = context.cloudflare.env.DB;
    const image = await getImageById(db, id);

    if (!image) {
      return json({ error: "Image not found" }, { status: 404 });
    }

    // 從 R2 存儲中刪除文件
    const bucket = context.cloudflare.env.IMAGES;
    await deleteFileFromR2(bucket, image.file_key);

    // 從數據庫中刪除記錄
    await deleteImage(db, id);

    return json({ success: true });
  } catch (error) {
    console.error("Failed to delete image:", error);
    return json({ error: "Failed to delete image" }, { status: 500 });
  }
}
