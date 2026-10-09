import { Task } from '../types';

export function correctTriviaAnswers(task: Task): number[] {
  return task.triviaAnswers ?? (task.triviaAnswer === undefined ? [] : [task.triviaAnswer]);
}

export function requiredTriviaAnswers(task: Task): number {
  return task.triviaRequiredAnswers ?? correctTriviaAnswers(task).length;
}

export function isTriviaSelectionCorrect(task: Task, selected: number[]): boolean {
  const accepted = correctTriviaAnswers(task);
  return new Set(selected).size === selected.length &&
    selected.length === requiredTriviaAnswers(task) && selected.every(i => accepted.includes(i));
}
