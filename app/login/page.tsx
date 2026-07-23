import { login } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form
        action={login}
        className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4"
      >
        <div>
          <h1 className="text-xl font-semibold text-white">CurritoAgents</h1>
          <p className="text-sm text-slate-400">Panel interno de leads</p>
        </div>
        {error && (
          <p className="text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <label className="block space-y-1">
          <span className="text-sm text-slate-300">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm text-slate-300">Contraseña</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 transition-colors"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
