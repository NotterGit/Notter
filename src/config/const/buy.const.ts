export type CheckStatus =
  | "loading"
  | "success"
  | "pending"
  | "cancel"
  | "foreign"
  | "not-found"
  | "missing"
  | "auth"
  | "failed"
  | "error"

export const statusClassName: Record<CheckStatus, string> = {
  loading: "bg-yellow-500/20 text-yellow-400",
  success: "bg-emerald-500/20 text-emerald-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  cancel: "bg-rose-500/20 text-rose-400",
  foreign: "bg-rose-500/20 text-rose-400",
  "not-found": "bg-rose-500/20 text-rose-400",
  missing: "bg-rose-500/20 text-rose-400",
  auth: "bg-rose-500/20 text-rose-400",
  failed: "bg-rose-500/20 text-rose-400",
  error: "bg-rose-500/20 text-rose-400",
}

export const statusLabel: Record<CheckStatus, string> = {
  loading: "Проверка",
  success: "Оплачен",
  pending: "В обработке",
  cancel: "Отменен",
  foreign: "Чужой заказ",
  "not-found": "Не найден",
  missing: "Нет номера",
  auth: "Нет доступа",
  failed: "Неуспешно",
  error: "Ошибка",
}

export const statusMessage: Record<CheckStatus, string> = {
  loading: "Проверяем платеж и статус заказа. Это может занять несколько секунд.",
  success: "Спасибо! Ваш платеж успешно обработан. Приятного пользования Notter Gem!",
  pending: "Платеж обрабатывается. Проверьте статус заказа немного позже.",
  cancel: "Заказ был отменен. Если вы хотите оформить покупку заново, вернитесь к выбору тарифа.",
  foreign: "Этот заказ принадлежит другому пользователю или организации.",
  "not-found": "Заказ не найден. Проверьте ссылку или попробуйте повторить проверку позже.",
  missing: "В ссылке нет номера заказа, поэтому мы не можем проверить платеж.",
  auth: "Войдите в аккаунт, чтобы проверить статус заказа.",
  failed: "Платеж не был успешно обработан. Если вы считаете, что это ошибка, свяжитесь с поддержкой.",
  error: "Произошла непредвиденная ошибка при проверке заказа.",
}

export const toastMessage: Partial<Record<CheckStatus, string>> = {
  success: "Заказ успешно оплачен",
  pending: "Платеж обрабатывается, подождите...",
  cancel: "Заказ отменен",
  foreign: "Этот заказ не принадлежит вам",
  "not-found": "Заказ не найден",
  missing: "Номер заказа не найден",
  auth: "Войдите в аккаунт",
  failed: "Платеж не был успешно обработан",
  error: "Произошла непредвиденная ошибка",
}