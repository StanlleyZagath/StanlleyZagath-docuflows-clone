import React from "react";

function inline(text: string, key: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={`${key}${i}`}>{p.slice(2, -2)}</strong>;
    if (p.startsWith("`") && p.endsWith("`"))
      return <code key={`${key}${i}`} className="rounded bg-slate-100 px-1 text-sm">{p.slice(1, -1)}</code>;
    return p;
  });
}

/** Renderizador mínimo e seguro (sem HTML bruto): títulos, listas, negrito e código. */
export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r/g, "").split("\n");
  const out: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    out.push(
      <Tag key={`l${out.length}`} className={`my-3 ml-6 space-y-1 ${list.ordered ? "list-decimal" : "list-disc"}`}>
        {list.items.map((it, i) => <li key={i}>{inline(it, `li${i}`)}</li>)}
      </Tag>,
    );
    list = null;
  };
  lines.forEach((line, idx) => {
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    const ul = /^\s*[-*]\s+(.*)$/.exec(line);
    const ol = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      const ordered = !!ol;
      if (!list || list.ordered !== ordered) { flush(); list = { ordered, items: [] }; }
      list.items.push((ul ?? ol)![1]);
      return;
    }
    flush();
    if (h) {
      const size = ["text-2xl", "text-xl", "text-lg"][h[1].length - 1];
      out.push(<h2 key={idx} className={`mt-6 mb-2 font-semibold ${size}`}>{inline(h[2], `h${idx}`)}</h2>);
    } else if (line.trim()) {
      out.push(<p key={idx} className="my-2 leading-relaxed">{inline(line, `p${idx}`)}</p>);
    }
  });
  flush();
  return <div className="text-slate-800">{out}</div>;
}
