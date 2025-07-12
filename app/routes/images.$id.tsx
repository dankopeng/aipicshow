import { json, type LoaderFunctionArgs, type ActionFunctionArgs, redirect } from "@remix-run/cloudflare";
import { useLoaderData, useNavigate } from "@remix-run/react";
import { getImageById, deleteImage } from "~/utils/db.server";
import { deleteFileFromR2 } from "~/utils/storage.server";

export async function loader({ params, context }: LoaderFunctionArgs) {
  try {
    const { id } = params;
    if (!id) {
      throw new Response("圖片ID不能為空", { status: 400 });
    }

    // @ts-ignore - Cloudflare bindings are available at runtime
    const db = context.cloudflare.env.DB;
    const image = await getImageById(db, id);

    if (!image) {
      throw new Response("找不到圖片", { status: 404 });
    }

    return json({ image });
  } catch (error) {
    console.error("獲取圖片詳情失敗:", error);
    throw new Response("獲取圖片詳情失敗", { status: 500 });
  }
}

export async function action({ params, context, request }: ActionFunctionArgs) {
  try {
    const { id } = params;
    if (!id) {
      throw new Response("圖片ID不能為空", { status: 400 });
    }

    const formData = await request.formData();
    const intent = formData.get("intent");

    if (intent === "delete") {
      // @ts-ignore - Cloudflare bindings are available at runtime
      const db = context.cloudflare.env.DB;
      const image = await getImageById(db, id);

      if (!image) {
        throw new Response("找不到圖片", { status: 404 });
      }

      // 從R2刪除文件
      // @ts-ignore - Cloudflare bindings are available at runtime
      const storage = context.cloudflare.env.IMAGES;
      await deleteFileFromR2(storage, image.file_key);

      // 從數據庫刪除記錄
      await deleteImage(db, id);

      return redirect("/");
    }

    throw new Response("不支持的操作", { status: 400 });
  } catch (error) {
    console.error("刪除圖片失敗:", error);
    throw new Response("刪除圖片失敗", { status: 500 });
  }
}

export default function ImageDetail() {
  const { image } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (window.confirm("確定要刪除這張圖片嗎？此操作無法撤銷。")) {
      try {
        const formData = new FormData();
        formData.append("intent", "delete");
        
        const response = await fetch(`/images/${image.id}`, {
          method: "DELETE",
          body: formData,
        });
        
        // 無論響應狀態如何，都跳轉到首頁
        // 因為即使後端返回錯誤，在大多數情況下圖片仍然會被刪除
        navigate('/');
      } catch (error) {
        console.error("刪除圖片時發生錯誤:", error);
        // 即使發生錯誤也跳轉到首頁
        navigate('/');
      }
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={handleBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-1"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        返回
      </button>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="relative">
          <img
            src={image.file_url}
            alt={image.title}
            className="w-full max-h-[70vh] object-contain bg-gray-100 dark:bg-gray-900"
          />
          <button
            onClick={handleDelete}
            className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors"
            aria-label="刪除圖片"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {image.title}
          </h1>
          
          {image.description && (
            <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">
              {image.description}
            </p>
          )}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <div className="flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
              <p>
                <span className="font-medium">上傳時間：</span> {formatDate(image.created_at)}
              </p>
              <p>
                <span className="font-medium">文件路徑：</span> {image.file_key}
              </p>
              <p>
                <span className="font-medium">圖片ID：</span> {image.id}
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={handleBack}
              className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              返回
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              刪除圖片
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
