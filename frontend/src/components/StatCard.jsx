export default function StatCard({ icon: Icon, label, value, accent = "text-cyan" }) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <Icon className={accent} size={20} />
      </div>
      <div className="mt-5 text-3xl font-semibold">{value}</div>
    </div>
  );
}
