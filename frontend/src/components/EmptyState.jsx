import { Sparkles } from "lucide-react";

export default function EmptyState({ title, description, action }) {
  return (
    <div className="panel flex flex-col items-center justify-center py-12 text-center">
      <Sparkles className="mb-4 text-cyan" size={30} />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-slate-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
