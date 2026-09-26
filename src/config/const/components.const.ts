export function formatFileSize(bytes?: number): string {
  if (!bytes) {
    return "0 Bytes";
  }
  const numBytes = Number(bytes);
  if (numBytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const dm = 2;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(numBytes) / Math.log(k));
  return `${parseFloat((numBytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const DROPZONE_VARIANTS = {
  base: "relative rounded-md flex justify-center items-center flex-col cursor-pointer min-h-[150px] min-w-[200px] border border-dashed border-gray-400 dark:border-gray-300 transition-colors duration-200 ease-in-out",
  image:
    "border-0 p-0 min-h-0 min-w-0 relative shadow-md bg-slate-200 dark:bg-slate-900 rounded-md",
  active: "border-2",
  disabled:
    "bg-gray-200 border-gray-300 cursor-default pointer-events-none bg-opacity-30 dark:bg-gray-700",
  accept: "border border-blue-500 bg-blue-500 bg-opacity-10",
  reject: "border border-red-700 bg-red-700 bg-opacity-10",
} as const;

export const DROPZONE_ERROR_MESSAGES = {
  fileTooLarge(maxSize: number, formatFn: (size: number) => string = formatFileSize) {
    return `Этот файл слишком большой. Максимальный размер ${formatFn(maxSize)}`;
  },
  fileInvalidType() {
    return "Неверный тип файла";
  },
  tooManyFiles(maxFiles: number) {
    return `Вы можете добавить максимум ${maxFiles} файлов`;
  },
  fileNotSupported() {
    return "Данный файл не поддерживается";
  },
};
