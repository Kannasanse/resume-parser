export const MIME_FROM_EXT = {
  pdf:  'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:  'application/msword',
};

export function mimeFromFilename(filename) {
  const ext = filename?.split('.').pop()?.toLowerCase();
  return MIME_FROM_EXT[ext] || 'application/pdf';
}
