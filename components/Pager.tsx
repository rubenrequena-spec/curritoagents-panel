import Link from "next/link";

export function Pager({
  page,
  totalPages,
  pageHref,
}: {
  page: number;
  totalPages: number;
  pageHref: (targetPage: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={pageHref(page - 1)} className="text-brand-blue hover:underline">
          ← Anterior
        </Link>
      ) : (
        <span className="text-slate-300">← Anterior</span>
      )}
      <span className="text-slate-500">
        Página {page} de {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={pageHref(page + 1)} className="text-brand-blue hover:underline">
          Siguiente →
        </Link>
      ) : (
        <span className="text-slate-300">Siguiente →</span>
      )}
    </div>
  );
}
