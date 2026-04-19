const supabase = require('./supabase');

const BUCKET = process.env.STORAGE_BUCKET || 'resumes';

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, { public: false });
  }
}

async function uploadFile(buffer, fileName, mimeType) {
  await ensureBucket();
  const path = `${Date.now()}_${fileName}`;
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path: data.path, url: urlData.publicUrl };
}

async function deleteFile(path) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

module.exports = { uploadFile, deleteFile };
