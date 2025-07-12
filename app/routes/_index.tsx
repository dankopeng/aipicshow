import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { getAllImages } from "~/utils/db.server";
import type { Image } from "~/utils/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "AI 圖片展示" },
    { name: "description", content: "展示您的 AI 生成圖片" },
  ];
};

export async function loader({ context }: LoaderFunctionArgs) {
  try {
    // @ts-ignore - Cloudflare bindings are available at runtime
    const db = context.cloudflare.env.DB;
    const images = await getAllImages(db);
    return json({ images });
  } catch (error) {
    console.error("獲取圖片失敗:", error);
    return json({ images: [] });
  }
}

export default function Index() {
  const { images } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            AI 圖片展示
          </h1>
          <Link 
            to="/upload" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            上傳新圖片
          </Link>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          展示您的 AI 生成圖片作品集
        </p>
      </header>

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-gray-400 mb-4" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <h2 className="text-xl font-medium text-gray-700 dark:text-gray-200 mb-2">
            尚未上傳任何圖片
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            點擊上方的「上傳新圖片」按鈕開始添加圖片
          </p>
          <Link 
            to="/upload" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            上傳新圖片
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((image) => (
            <Link 
              key={image.id} 
              to={`/images/${image.id}`}
              className="group block overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={image.file_url}
                  alt={image.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-1 truncate">
                  {image.title}
                </h2>
                {image.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {image.description}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
