import { Alert, Linking } from 'react-native';
import { Task } from '../types';
export function reportURL(task?: Task) {
  const title = task ? `Question report: ${task.id}` : 'Side Quest support request';
  const body = task ? `Card ID: ${task.id}\nQuestion: ${task.description}\nChoices: ${(task.triviaChoices ?? []).join(' | ')}\n\nWhat needs correcting?\n\nSuggested source or correction:\n` : 'What happened?\n\nWhat did you expect?\n\nDevice/browser (optional):\n';
  return `https://github.com/Audge93/SideQuest/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}
export function openSupport(task?: Task) {
  Linking.openURL(reportURL(task)).catch(() => Alert.alert('Could not open support', 'Visit github.com/Audge93/SideQuest/issues in your browser.'));
}
