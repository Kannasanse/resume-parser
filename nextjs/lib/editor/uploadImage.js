export async function uploadImageFile(file, noteId) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`/api/v1/notes/upload-image?noteId=${encodeURIComponent(noteId)}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Upload failed');
  }

  const { url } = await res.json();
  return url;
}
