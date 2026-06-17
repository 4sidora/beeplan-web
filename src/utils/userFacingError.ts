const TECHNICAL =
  /localhost|127\.0\.0\.1|docker|ipconfig|traceback|exception|sqlalchemy|uvicorn|http:\/\/|https:\/\/|failed to fetch|networkerror|err_connection/i;

function looksTechnical(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return true;
  if (trimmed.length > 160) return true;
  return TECHNICAL.test(trimmed);
}

export function httpErrorMessage(status: number, detail?: string): string {
  const text = detail?.trim();
  if (status === 400) {
    return text && !looksTechnical(text) ? text : "Некорректный запрос";
  }
  if (status === 401) {
    return text && !looksTechnical(text) ? text : "Неверный email или пароль";
  }
  if (status === 403) return "Недостаточно прав";
  if (status === 404) return "Не найдено";
  if (status === 409) {
    return text && !looksTechnical(text) ? text : "Такие данные уже существуют";
  }
  if (status >= 500) return "Ошибка на сервере. Попробуйте позже.";
  if (text && !looksTechnical(text)) return text;
  return "Не удалось выполнить запрос";
}

export function toUserFacingError(error: unknown, fallback = "Что-то пошло не так"): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "Сервер не отвечает. Попробуйте позже.";
  }
  if (error instanceof TypeError) {
    return "Нет связи с сервером. Проверьте интернет.";
  }
  if (error instanceof Error) {
    const msg = error.message.trim();
    if (!msg || looksTechnical(msg)) return fallback;
    return msg;
  }
  if (typeof error === "string") {
    const msg = error.trim();
    if (!msg || looksTechnical(msg)) return fallback;
    return msg;
  }
  return fallback;
}
