export interface BuildPromptWithContextOptions {
  prompt: string;
  noteContext?: string;
  documentTitle?: string;
}

/**
 * Organizes the user's prompt with the full content of the current note
 * into a clean, delimiter-enclosed format that LLMs easily recognize and parse.
 */
export function buildPromptWithContext(options: BuildPromptWithContextOptions): string {
  const { prompt, noteContext, documentTitle } = options;
  const trimmedContext = noteContext?.trim();
  const trimmedPrompt = prompt.trim();

  if (!trimmedContext) {
    return trimmedPrompt;
  }

  // Safety truncation for very large documents (approx. 20,000 words / 80k characters)
  const maxContextChars = 80000;
  const safeContext =
    trimmedContext.length > maxContextChars
      ? `${trimmedContext.slice(0, maxContextChars)}\n\n... [Часть содержимого заметки усечена из-за ограничения размера] ...`
      : trimmedContext;

  const titleHeader =
    documentTitle?.trim() && documentTitle.trim() !== "Без названия"
      ? `Название заметки: "${documentTitle.trim()}"\n\n`
      : "";

  return `Ниже приведено текущее содержимое заметки пользователя для контекста. Используй эту информацию, чтобы понять тему, продолжить текст, дополнить или изменить его в соответствии с запросом.

<note_context>
${titleHeader}${safeContext}
</note_context>

Запрос пользователя:
${trimmedPrompt}

Инструкция: сформируй ответ строго по запросу пользователя с учётом контекста заметки выше. Выведи только готовый текст без вводных фраз, мета-комментариев и заключений.`;
}
