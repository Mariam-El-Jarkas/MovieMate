import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="ft">
      <div className="w ft-row">
        <div className="ft-brand"><img src="/logo.jpeg" alt="" /><b>MovieMate</b></div>
        <nav className="ft-links" aria-label="Footer navigation">
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/privacy">Privacy</Link>
          <Link to="/terms">Terms</Link>
        </nav>
        <span className="ft-bottom">© {new Date().getFullYear()} MovieMate · Every movie, any year.</span>
      </div>
    </footer>
  );
}
