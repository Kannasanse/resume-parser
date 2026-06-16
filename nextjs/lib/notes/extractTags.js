export function extractTagsFromContent(tiptapJson) {
  const tags = new Set();

  function walk(node) {
    if (!node) return;
    if (node.marks) {
      node.marks.forEach(mark => {
        if (mark.type === 'tag' && mark.attrs?.slug) {
          tags.add(mark.attrs.slug);
        }
      });
    }
    if (node.content) node.content.forEach(walk);
  }

  walk(tiptapJson);
  return [...tags];
}
