import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const searchKey = new PluginKey('search');

function getMatches(doc, term, caseSensitive = false) {
  if (!term) return [];
  const matches = [];
  const flags = caseSensitive ? 'g' : 'gi';
  let re;
  try { re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags); }
  catch { return []; }

  doc.descendants((node, pos) => {
    if (!node.isText) return;
    let m;
    while ((m = re.exec(node.text)) !== null) {
      matches.push({ from: pos + m.index, to: pos + m.index + m[0].length });
    }
  });
  return matches;
}

export const SearchExtension = Extension.create({
  name: 'searchHighlight',

  addStorage() {
    return { term: '', results: [], resultIndex: 0, caseSensitive: false };
  },

  addCommands() {
    return {
      setSearchTerm: (term) => ({ editor }) => {
        editor.storage.searchHighlight.term = term;
        editor.storage.searchHighlight.resultIndex = 0;
        const matches = getMatches(editor.state.doc, term, editor.storage.searchHighlight.caseSensitive);
        editor.storage.searchHighlight.results = matches;
        editor.view.dispatch(editor.state.tr.setMeta(searchKey, { term, resultIndex: 0 }));
        return true;
      },

      nextSearchResult: () => ({ editor }) => {
        const { results, resultIndex } = editor.storage.searchHighlight;
        if (!results.length) return false;
        const next = (resultIndex + 1) % results.length;
        editor.storage.searchHighlight.resultIndex = next;
        editor.view.dispatch(editor.state.tr.setMeta(searchKey, { resultIndex: next }));
        const match = results[next];
        if (match) {
          editor.commands.setTextSelection(match);
          editor.view.dispatch(editor.state.tr.scrollIntoView());
        }
        return true;
      },

      previousSearchResult: () => ({ editor }) => {
        const { results, resultIndex } = editor.storage.searchHighlight;
        if (!results.length) return false;
        const prev = (resultIndex - 1 + results.length) % results.length;
        editor.storage.searchHighlight.resultIndex = prev;
        editor.view.dispatch(editor.state.tr.setMeta(searchKey, { resultIndex: prev }));
        const match = results[prev];
        if (match) {
          editor.commands.setTextSelection(match);
          editor.view.dispatch(editor.state.tr.scrollIntoView());
        }
        return true;
      },

      resetSearch: () => ({ editor }) => {
        editor.storage.searchHighlight.term = '';
        editor.storage.searchHighlight.results = [];
        editor.storage.searchHighlight.resultIndex = 0;
        editor.view.dispatch(editor.state.tr.setMeta(searchKey, { term: '', resultIndex: 0 }));
        return true;
      },

      setReplaceTerm: (replaceTerm) => ({ editor }) => {
        editor.storage.searchHighlight.replaceTerm = replaceTerm;
        return true;
      },

      replace: () => ({ editor, commands }) => {
        const { results, resultIndex, replaceTerm = '' } = editor.storage.searchHighlight;
        const match = results[resultIndex];
        if (!match) return false;
        commands.insertContentAt({ from: match.from, to: match.to }, replaceTerm);
        const newTerm = editor.storage.searchHighlight.term;
        const newMatches = getMatches(editor.state.doc, newTerm, editor.storage.searchHighlight.caseSensitive);
        editor.storage.searchHighlight.results = newMatches;
        const newIdx = Math.min(resultIndex, newMatches.length - 1);
        editor.storage.searchHighlight.resultIndex = Math.max(0, newIdx);
        editor.view.dispatch(editor.state.tr.setMeta(searchKey, { term: newTerm, resultIndex: editor.storage.searchHighlight.resultIndex }));
        return true;
      },

      replaceAll: () => ({ editor, commands }) => {
        const { term, replaceTerm = '', caseSensitive } = editor.storage.searchHighlight;
        if (!term) return false;
        const flags = caseSensitive ? 'g' : 'gi';
        let re;
        try { re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags); }
        catch { return false; }

        const { tr, doc } = editor.state;
        const replacements = [];
        doc.descendants((node, pos) => {
          if (!node.isText) return;
          let m;
          while ((m = re.exec(node.text)) !== null) {
            replacements.push({ from: pos + m.index, to: pos + m.index + m[0].length });
          }
        });
        // Apply replacements in reverse to preserve positions
        for (let i = replacements.length - 1; i >= 0; i--) {
          const { from, to } = replacements[i];
          tr.replaceWith(from, to, editor.schema.text(replaceTerm));
        }
        editor.view.dispatch(tr);
        editor.storage.searchHighlight.results = [];
        editor.storage.searchHighlight.resultIndex = 0;
        editor.view.dispatch(editor.state.tr.setMeta(searchKey, { term: '', resultIndex: 0 }));
        return true;
      },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.editor.storage.searchHighlight;

    return [
      new Plugin({
        key: searchKey,
        state: {
          init() { return { term: '', resultIndex: 0 }; },
          apply(tr, prev) {
            const meta = tr.getMeta(searchKey);
            if (meta !== undefined) {
              return { term: meta.term ?? prev.term, resultIndex: meta.resultIndex ?? prev.resultIndex };
            }
            return prev;
          },
        },
        props: {
          decorations(state) {
            const { term, resultIndex } = this.getState(state);
            if (!term) return DecorationSet.empty;
            const matches = getMatches(state.doc, term, storage.caseSensitive);
            storage.results = matches;
            const decos = matches.map((m, i) =>
              Decoration.inline(m.from, m.to, {
                class: i === resultIndex ? 'search-result-current' : 'search-result',
              })
            );
            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
});
