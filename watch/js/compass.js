// A transparent suggestion based on recorded playback, never a claim of mastery.
export function compass(state, now = new Date()) {
  let total = 0, ai = 0;
  for (const [day, entry] of Object.entries(state.daily || {})) {
    const date = new Date(day + 'T12:00:00');
    const age = (now - date) / 86400000;
    if (!Number.isFinite(age) || age < -1 || age >= 7) continue;
    total += Math.max(0, entry.sec || 0);
    ai += Math.max(0, entry.byCat?.ai || 0) + Math.max(0, entry.byCat?.cs || 0);
  }
  const result = { minutes: Math.round(total / 60), aiShare: total ? Math.round(ai / total * 100) : 0 };
  if (!total) return { ...result, title: 'Start with one AI question.', body: 'Choose one AI lesson, then write what you could build with it. Your time breakdown will appear as you watch.', href: '#/?t=ai', action: 'Find an AI lesson' };
  if (ai / total < 0.5) return { ...result, title: 'Bring the next session back to AI?', body: 'Most recorded time this week went elsewhere. Since AI is your current priority, try an AI lesson next. Your other interests are still here whenever you want them.', href: '#/?t=ai', action: 'Return to AI' };
  return { ...result, title: 'Turn the learning into a small experiment.', body: 'AI and computer science have most of your recorded time this week. Write one idea to test, or visit Agentic AI to put it into practice. A history or literature detour is here when you want a change.', href: '../curiosity.html', action: 'Open Agentic AI' };
}
