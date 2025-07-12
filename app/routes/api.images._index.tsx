import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { getAllImages, createImage } from "~/utils/db.server";
import { generateUniqueFileName, getMimeType, uploadFileToR2 } from "~/utils/storage.server";

/**
 * GET /api/images - 獲取所有圖片列表
 */
export async function loader({ context }: LoaderFunctionArgs) {
  try {
    const db = context.cloudflare.env.DB;
    const images = await getAllImages(db);
    return json(images);
  } catch (error) {
    console.error("Failed to get images:", error);
    return json({ error: "Failed to get images" }, { status: 500 });
  }
}

/**
 * POST /api/images - 上傳新圖片
 */
export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const imageFile = formData.get("image") as File;

    if (!title || !imageFile) {
      return json(
        { error: "Title and image are required" },
        { status: 400 }
      );
    }

    // 獲取文件數據
    const fileData = await imageFile.arrayBuffer();
    const fileName = generateUniqueFileName(imageFile.name);
    const contentType = getMimeType(fileName);

    // 上傳到 R2 存儲
    const bucket = context.cloudflare.env.IMAGES;
    const { key, url } = await uploadFileToR2(
      bucket,
      fileData,
      fileName,
      contentType
    );

    // 保存到數據庫
    const db = context.cloudflare.env.DB;
    const image = await createImage(db, {
      title,
      description: description || undefined,
      file_key: key,
      file_url: url,
    });

    return json(image, { status: 201 });
  } catch (error) {
    console.error("Failed to upload image:", error);
    return json({ error: "Failed to upload image" }, { status: 500 });
  }
}
