import type { PromptKind } from "./streak";

export type LessonSeat = {
  kind: PromptKind;
  answererId: number | null;
  answers: { memberId: number }[];
  guesses: { memberId: number }[];
};

export function iDidMyPart(lesson: LessonSeat, memberId: number): boolean {
  if (lesson.kind === "guess") {
    if (lesson.answererId === memberId) {
      return lesson.answers.some((a) => a.memberId === memberId);
    }
    return lesson.guesses.some((g) => g.memberId === memberId);
  }
  return lesson.answers.some((a) => a.memberId === memberId);
}

export function canActOnLesson(lesson: LessonSeat, memberId: number): boolean {
  if (lesson.kind === "guess") {
    const iAmAnswerer = lesson.answererId === memberId;
    const myAnswer = lesson.answers.some((a) => a.memberId === memberId);
    const myGuess = lesson.guesses.some((g) => g.memberId === memberId);
    const answererAnswered = lesson.answers.some(
      (a) => a.memberId === lesson.answererId,
    );
    if (iAmAnswerer) return !myAnswer;
    return answererAnswered && !myGuess;
  }
  return !iDidMyPart(lesson, memberId);
}
