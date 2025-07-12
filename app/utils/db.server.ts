import { nanoid } from 'nanoid';

export interface Image {
  id: string;
  title: string;
  description: string | null;
  file_key: string;
  file_url: string;
  created_at: string;
}

export async function getAllImages(db: D1Database): Promise<Image[]> {
  const { results } = await db
    .prepare('SELECT * FROM images ORDER BY created_at DESC')
    .all<Image>();
  
  return results;
}

export async function getImageById(db: D1Database, id: string): Promise<Image | null> {
  const image = await db
    .prepare('SELECT * FROM images WHERE id = ?')
    .bind(id)
    .first<Image>();
  
  return image || null;
}

export async function createImage(
  db: D1Database, 
  data: { title: string; description?: string; file_key: string; file_url: string; }
): Promise<Image> {
  const id = nanoid();
  const { title, description, file_key, file_url } = data;
  
  await db
    .prepare(
      'INSERT INTO images (id, title, description, file_key, file_url) VALUES (?, ?, ?, ?, ?)'
    )
    .bind(id, title, description || null, file_key, file_url)
    .run();
  
  const image = await getImageById(db, id);
  if (!image) {
    throw new Error('Failed to create image');
  }
  
  return image;
}

export async function deleteImage(db: D1Database, id: string): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM images WHERE id = ?')
    .bind(id)
    .run();
  
  return result.success;
}
