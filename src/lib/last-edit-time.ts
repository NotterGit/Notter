export function getCurrentEditTime() {
  return new Date().toISOString()
}

export function formatLastEditTime(value?: string) {
  if (!value) {
    return "Неизвестно"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}
