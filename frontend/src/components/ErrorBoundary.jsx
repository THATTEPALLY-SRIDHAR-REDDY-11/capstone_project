import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid min-h-screen place-items-center bg-[#0f1724] p-6 text-white">
          <div className="max-w-lg rounded-md border border-red-400/30 bg-red-500/10 p-5">
            <h1 className="text-lg font-semibold">Frontend error</h1>
            <p className="mt-2 text-sm text-red-100">{this.state.error.message}</p>
            <button className="btn-primary mt-4" onClick={() => window.location.reload()}>Reload</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
