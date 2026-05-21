export default function Spinner({ fullScreen = false }) {
  return (
    <div className={fullScreen ? "flex min-h-screen items-center justify-center bg-night" : "flex items-center justify-center p-6"}>
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-cyan" />
    </div>
  );
}
