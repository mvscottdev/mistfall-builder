/** Shown instead of the app when the Snapshot can't be loaded. */
export function LoadError({ message }: { message: string }) {
  return (
    <main
      role="alert"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-neutral-950 p-4 text-center text-neutral-100"
    >
      {/* Shown before i18n can load, so both languages at once. */}
      <h1 className="text-2xl font-semibold">Game data could not be loaded</h1>
      <p className="text-neutral-400">Не удалось загрузить данные игры</p>
      <p className="max-w-xl font-mono text-sm break-words text-red-300">{message}</p>
    </main>
  );
}
