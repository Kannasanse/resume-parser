import supabase from './supabase.js';

const BUCKET = process.env.STORAGE_BUCKET || 'resumes';

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some(b => b.name === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: false });
  }
}

export async function uploadFile(buffer, fileName, mimeType) {
  await ensureBucket();
  const path = `${Date.now()}_${fileName}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path: data.path, url: urlData.publicUrl };
}

export async function deleteFile(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}
