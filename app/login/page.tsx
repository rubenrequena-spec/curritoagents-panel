import { login } from "@/app/actions/auth";
import { LogoLockup } from "@/components/Logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-ink px-4">
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle at 30% 30%, #1E4DF0, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -left-20 h-[360px] w-[360px] rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle at 50% 50%, #FF7A1A, transparent 70%)" }}
      />

      <form
        action={login}
        className="relative w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-brand-ink/60 p-8 shadow-2xl backdrop-blur"
      >
        <div className="space-y-1">
          <LogoLockup />
          <p className="pt-2 text-sm text-slate-400">Panel interno de leads</p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-300">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none transition-colors focus:border-brand-blue"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-300">Contraseña</span>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white outline-none transition-colors focus:border-brand-blue"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-brand-blue py-2.5 font-medium text-white transition-colors hover:bg-blue-600"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
