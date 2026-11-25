import { Component } from 'react';

// Shows the error on screen instead of a blank white page.
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
        <h1>Something went wrong</h1>
        <p>Take a screenshot of this and send it to Claude.</p>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: 16, borderRadius: 12 }}>{String(this.state.error.stack || this.state.error)}</pre>
        <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }}>Reset and go to login</button>
      </div>
    );
  }
}
