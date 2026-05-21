import React from "react";
import { AlertTriangle } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-night p-6 text-white">
          <div className="panel max-w-md text-center">
            <AlertTriangle className="mx-auto mb-4 text-coral" size={34} />
            <h1 className="text-2xl font-semibold">Something needs attention</h1>
            <p className="mt-3 text-sm text-slate-400">Refresh the page or return to the dashboard to continue your interview prep.</p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
