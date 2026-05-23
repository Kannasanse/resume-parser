import { Node } from '@tiptap/core';

export const CALLOUT_TYPES = {
  info:      { icon: '💡', label: 'Note' },
  success:   { icon: '✅', label: 'Success' },
  warning:   { icon: '⚠️', label: 'Warning' },
  danger:    { icon: '🚨', label: 'Danger' },
  important: { icon: '🔥', label: 'Important' },
  tip:       { icon: '🎯', label: 'Tip' },
  quote:     { icon: '💬', label: 'Quote' },
};

export const CalloutExtension = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  atom: false,

  addAttributes() {
    return {
      calloutType: {
        default: 'info',
        parseHTML: el => el.getAttribute('data-callout-type') || 'info',
        renderHTML: attrs => ({ 'data-callout-type': attrs.calloutType }),
      },
      icon: {
        default: '💡',
        parseHTML: el => {
          const iconEl = el.querySelector('.note-callout-icon');
          return iconEl ? iconEl.textContent : '💡';
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="callout"]' }];
  },

  renderHTML({ node }) {
    return [
      'div',
      {
        class: 'note-callout',
        'data-type': 'callout',
        'data-callout-type': node.attrs.calloutType,
      },
      ['span', { class: 'note-callout-icon' }, node.attrs.icon],
      ['div', { class: 'note-callout-content' }, 0],
    ];
  },

  addCommands() {
    return {
      insertCallout:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: {
              calloutType: attrs?.type || 'info',
              icon: attrs?.icon || CALLOUT_TYPES[attrs?.type]?.icon || '💡',
            },
            content: [{ type: 'paragraph' }],
          }),
    };
  },
});
