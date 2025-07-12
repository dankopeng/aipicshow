import { useRef, useState } from "react";
import { json, redirect, type ActionFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { createImage } from "~/utils/db.server";
import { generateUniqueFileName, getMimeType, uploadFileToR2 } from "~/utils/storage.server";

export const meta: MetaFunction = () => {
  return [
    { title: "上傳新圖片 - AI 圖片展示" },
    { name: "description", content: "上傳您的 AI 生成圖片" },
  ];
};

export async function action({ request, context }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    
    // 獲取表單數據
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const imageFile = formData.get("image") as File;
    
    // 驗證數據
    const errors: Record<string, string> = {};
    
    if (!title || title.trim() === "") {
      errors.title = "標題不能為空";
    }
    
    if (!imageFile || imageFile.size === 0) {
      errors.image = "請選擇要上傳的圖片";
    } else {
      // 檢查文件類型
      const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      if (!validTypes.includes(imageFile.type)) {
        errors.image = "只支持 JPG、PNG、GIF 和 WebP 格式的圖片";
      }
      
      // 檢查文件大小（限制為 5MB）
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (imageFile.size > maxSize) {
        errors.image = "圖片大小不能超過 5MB";
      }
    }
    
    if (Object.keys(errors).length > 0) {
      return json({ errors, values: { title, description } }, { status: 400 });
    }
    
    // 處理文件上傳
    const arrayBuffer = await imageFile.arrayBuffer();
    const fileName = generateUniqueFileName(imageFile.name);
    const contentType = getMimeType(fileName);
    
    // @ts-ignore - Cloudflare bindings are available at runtime
    const storage = context.cloudflare.env.IMAGES;
    const { key, url } = await uploadFileToR2(storage, arrayBuffer, fileName, contentType);
    
    // 保存到數據庫
    // @ts-ignore - Cloudflare bindings are available at runtime
    const db = context.cloudflare.env.DB;
    await createImage(db, {
      title,
      description: description || undefined,
      file_key: key,
      file_url: url,
    });
    
    // 重定向到首頁
    return redirect("/");
  } catch (error) {
    console.error("上傳圖片失敗:", error);
    return json({ 
      errors: { _form: "上傳圖片時發生錯誤，請稍後再試" },
      values: {}
    }, { status: 500 });
  }
}

export default function Upload() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };
  
  const handleReset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setPreviewUrl(null);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          上傳新圖片
        </h1>
        
        <Form method="post" encType="multipart/form-data" className="space-y-6">
          {actionData?.errors?._form && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {actionData.errors._form}
            </div>
          )}
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              標題 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              defaultValue={actionData?.values?.title || ""}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="請輸入圖片標題"
              required
            />
            {actionData?.errors?.title && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.title}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              描述
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={actionData?.values?.description || ""}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="請輸入圖片描述（選填）"
            />
          </div>
          
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              圖片文件 <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <div className="space-y-1 text-center">
                {previewUrl ? (
                  <div className="mb-4">
                    <img
                      src={previewUrl}
                      alt="圖片預覽"
                      className="mx-auto h-64 object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleReset}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      移除圖片
                    </button>
                  </div>
                ) : (
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label
                    htmlFor="image"
                    className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                  >
                    <span>選擇圖片</span>
                    <input
                      id="image"
                      name="image"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="sr-only"
                      required
                    />
                  </label>
                  <p className="pl-1">或拖放至此處</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  支持 PNG, JPG, GIF, WebP 格式，最大 5MB
                </p>
              </div>
            </div>
            {actionData?.errors?.image && (
              <p className="mt-1 text-sm text-red-600">{actionData.errors.image}</p>
            )}
          </div>
          
          <div className="flex items-center justify-end space-x-4">
            <a
              href="/"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              取消
            </a>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "上傳中..." : "上傳圖片"}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
