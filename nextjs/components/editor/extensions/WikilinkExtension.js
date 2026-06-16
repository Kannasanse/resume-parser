import { Node, mergeAttributes } from '@tiptap/core';

export const WikilinkExtension = Node.create({
  name: 'wikilink',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      noteId:    { default: null },
      noteTitle: { default: '' },
      resolved:  { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-wikilink]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-wikilink':   node.attrs.noteId || '',
        'data-note-title': node.attrs.noteTitle || '',
        class: node.attrs.resolved
          ? 'wikilink wikilink-resolved'
          : 'wikilink wikilink-unresolved',
      }),
      `[[${node.attrs.noteTitle || ''}]]`,
    ];
  },
});
