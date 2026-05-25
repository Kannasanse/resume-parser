import { Mark, markInputRule } from '@tiptap/core';

export const TagExtension = Mark.create({
  name: 'tag',

  addAttributes() {
    return {
      slug:  { default: null },
      label: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-tag]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      { 'data-tag': HTMLAttributes.slug, class: 'editor-tag' },
      0,
    ];
  },

  // Typing "#word " converts text to a tag mark
  addInputRules() {
    return [
      markInputRule({
        find: /(#[\w-]+)\s$/,
        type: this.type,
        getAttributes: match => ({
          slug:  match[1].slice(1).toLowerCase(),
          label: match[1],
        }),
      }),
    ];
  },
});
