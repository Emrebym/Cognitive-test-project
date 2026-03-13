import { BANK, SECTION_META } from '../data/questionBank';

export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildSections(lang) {
  const isTR = lang === 'tr';
  return SECTION_META.map(meta => {
    const pool = BANK[meta.id] || [];
    const picked = [];
    meta.pickPerDiff.forEach((n, idx) => {
      const diff = idx + 1;
      shuffle(pool.filter(q => q.difficulty === diff)).slice(0, n).forEach(q => picked.push(q));
    });
    picked.sort((a, b) => a.difficulty - b.difficulty);

    const questions = picked.map(q => {
      const prompt = isTR ? (q.prompt_tr || q.prompt_en || '') : (q.prompt_en || '');
      const base = { ...q, prompt };

      if (q.choices_en) {
        base.choices = isTR ? q.choices_tr : q.choices_en;
        base.answer = isTR ? q.answer_tr : q.answer_en;
      }
      if (q.type === 'word-recall') {
        base.words = isTR ? (q.words_tr || q.words) : q.words;
        base.choices = isTR ? (q.choices_tr || q.choices) : q.choices;
        base.answer = isTR ? (q.answer_tr || q.answer) : q.answer;
      }
      if (q.type === 'odd-one-out') {
        base.items = isTR ? (q.items_tr || q.items_en) : q.items_en;
        base.answer = isTR ? (q.answer_tr || q.answer_en) : q.answer_en;
        base.explanation = isTR ? (q.explanation_tr || q.explanation_en) : q.explanation_en;
      }
      if (q.type === 'n-back') {
        base.sequence = isTR ? (q.sequence_tr || q.sequence_en) : q.sequence_en;
      }
      if (q.type === 'story-recall') {
        base.story = isTR ? q.story_tr : q.story_en;
        base.choices = isTR ? q.choices_tr : q.choices_en;
        base.answer = isTR ? q.answer_tr : q.answer_en;
      }
      if (q.note_en) {
        base.note = isTR ? q.note_tr : q.note_en;
      }
      return base;
    });

    return { ...meta, questions };
  });
}

export const DC = { 1: '#10B981', 2: '#F59E0B', 3: '#FF6B35', 4: '#EF4444' };
