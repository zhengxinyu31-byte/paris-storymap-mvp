export const QUIZ_KEY = 'paris-storymap-quiz-v1';
export const emptyQuiz = () => ({version: 1, answers: {}, step: 0});
const validChoice = (value, question) => Number.isInteger(value) && value >= 0 && value < question.options.length;
const isRecord = value => value && typeof value === 'object' && !Array.isArray(value);

export function restoreQuiz(raw, questions) {
  try {
    const value = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1 || !isRecord(value.answers)) return emptyQuiz();
    const answers = {};
    for (const q of questions) {
      if (!validChoice(value.answers[q.id], q)) break;
      answers[q.id] = value.answers[q.id];
    }
    const lastAvailable = Math.min(Object.keys(answers).length, questions.length - 1);
    const step = Number.isInteger(value.step) ? Math.max(0, Math.min(value.step, lastAvailable)) : lastAvailable;
    return {version: 1, answers, step};
  } catch { return emptyQuiz(); }
}

export function answerQuestion(session, id, choice, questions) {
  const index = questions.findIndex(q => q.id === id);
  if (index < 0 || !validChoice(choice, questions[index])) return session;
  return {version: 1, answers: {...session.answers, [id]: choice}, step: Math.min(index + 1, questions.length - 1)};
}

export function matchPersona(answers, questions, personas) {
  if (!isRecord(answers) || questions.some(q => !validChoice(answers[q.id], q))) return null;
  // One retained question per dimension. Rescale its 0/1/2 score to the
  // original 0–6 range, then keep the original >=4 threshold. Middle choices
  // therefore join the lower-intensity group; this is a four-question heuristic.
  const dimensions = Object.fromEntries(questions.map(q => [q.dimension, q.options[answers[q.id]].score * 3 >= 4 ? 1 : 0]));
  return personas.find(p => questions.every(q => p.dimensions[q.dimension] === dimensions[q.dimension])) || null;
}
