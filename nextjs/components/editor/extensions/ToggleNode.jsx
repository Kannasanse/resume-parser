import { Node } from '@tiptap/core';

export const ToggleExtension = Node.create({
  name: 'toggle',

  group: 'block',

  content: 'block+',

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: el => el.hasAttribute('open'),
        renderHTML: attrs => (attrs.open ? { open: '' } : {}),
      },
      summary: {
        default: 'Toggle',
        parseHTML: el => {
          const summaryEl = el.querySelector('summary');
          return summaryEl ? summaryEl.textContent : 'Toggle';
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'details.note-toggle' }];
  },

  renderHTML({ node }) {
    const detailsAttrs = {
      class: 'note-toggle',
      ...(node.attrs.open ? { open: '' } : {}),
    };
    return [
      'details',
      detailsAttrs,
      ['summary', { class: 'note-toggle-header' }, node.attrs.summary],
      ['div', { class: 'note-toggle-body' }, 0],
    ];
  },

  addCommands() {
    return {
      insertToggle:
        () =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { open: true, summary: 'Toggle' },
            content: [{ type: 'paragraph' }],
          }),
    };
  },
});
