import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

const Tile = ({ t, d }) => <div className="card pad about-feature-card"><h3 style={{ margin: '0 0 8px', fontSize: 20 }}>{t}</h3><div className="small" style={{ fontSize: 15 }}>{d}</div></div>;

export function About() {
  return (
    <div className="w about-page" style={{ paddingTop: 56 }}>
      <div className="card hero" style={{ padding: 56 }}><h1 className="h1">Your movie diary,<br /><span style={{ color: '#FFC93C' }}>shared with friends.</span></h1><p style={{ maxWidth: 560, fontSize: 18 }}>MovieMate is a place to log every movie you watch, rate it your way, and see what your friends really thought.</p></div>
      <div className="sec"><h2>What you can do</h2></div>
      <div className="g3"><Tile t="Keep a diary" d="Search any movie, old or new, and rate it on 12 simple questions." /><Tile t="Watch together" d="Tag friends and see everyone's review on the same movie post." /><Tile t="Plan what is next" d="Save movies to your waitlist and browse them like a cinema." /></div>
      <div className="sec"><h2>How it works</h2></div>
      <div className="g3"><Tile t="1. Add a movie" d="Search by title and pick it from the results." /><Tile t="2. Review it" d="Answer the questions alone or with friends you tag." /><Tile t="3. Look back" d="Scroll your library and earn badges as you watch." /></div>
      <div className="about-cta"><b>Got an idea for MovieMate?</b><Link to="/contact" className="btn dark about-cta-link">Tell us <span className="about-cta-arrow" aria-hidden="true">→</span></Link></div>
    </div>
  );
}

export function Contact() {
  const [sent, setSent] = useState(false);
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api('/contact', { method: 'POST', body: f });
      setSent(true);
      setError('');
    } catch (e) { setError(e.message); }
  };
  return (
    <div className="w contact-page" style={{ paddingTop: 40 }}>
      <h1 className="h1">Contact us</h1>
      <p className="small contact-intro" style={{ fontSize: 17 }}>Questions, ideas or bugs? Send us a message.</p>
      <div className="row contact-layout" style={{ gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <form className="card contact-form" style={{ padding: 32, flex: 2, minWidth: 280 }} onSubmit={submit}>
          {sent ? <><h2 style={{ marginTop: 0 }}>Thank you!</h2><p>We got your message.</p></> : <>
            <label className="f" htmlFor="c1" style={{ marginTop: 0 }}>Name</label><input id="c1" className="in" value={f.name} onChange={set('name')} />
            <label className="f" htmlFor="c2">Email</label><input id="c2" className="in" type="email" value={f.email} onChange={set('email')} />
            <label className="f" htmlFor="c3">Subject</label><input id="c3" className="in" value={f.subject} onChange={set('subject')} />
            <label className="f" htmlFor="c4">Message</label><textarea id="c4" className="in" style={{ marginTop: 6, height: 140 }} value={f.message} onChange={set('message')} />
            {error && <p role="alert" className="alert-message">{error}</p>}
            <button className="btn" style={{ marginTop: 20 }}>Send message</button></>}
        </form>
        <aside className="card contact-details">
          <section>
            <div className="contact-detail-heading">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
              <h3>Email</h3>
            </div>
            <p className="contact-detail-copy">For support, feedback or general questions, send us a message.</p>
            <a className="small" href="mailto:moviemate.legal@gmail.com">moviemate.legal@gmail.com</a>
          </section>
          <section className="response-hours">
            <div className="response-hours-heading">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
              <h3>Suggested response hours</h3>
            </div>
            <p>Monday – Saturday<br />10:00 AM – 8:00 PM</p>
            <span className="small">Suggested hours, not confirmed.</span>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Legal({ title, secs }) {
  const getActiveSection = () => {
    const match = window.location.hash.match(/^#s(\d+)$/);
    const index = match ? Number(match[1]) : 0;
    return index < secs.length ? index : 0;
  };
  const [activeSection, setActiveSection] = useState(getActiveSection);
  useEffect(() => {
    const onHashChange = () => setActiveSection(getActiveSection());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [secs.length]);

  return (
    <>
      <div className="w legal-heading"><span className="chip legal-label">Legal</span><h1 className="h1">{title}</h1></div>
      <div className="w legal">
        <nav className="card legal-nav" aria-label={`${title} sections`}>{secs.map(([s], i) => <div key={s} className="legal-nav-row"><a href={`#s${i}`} className={`legal-nav-item${activeSection === i ? ' active' : ''}`} aria-current={activeSection === i ? 'location' : undefined} onClick={() => setActiveSection(i)}>{s}</a></div>)}</nav>
        <div className="card legal-content">{secs.map(([s, d], i) => (
          <div key={s} id={`s${i}`} className="legal-section" style={{ marginTop: i ? 24 : 0 }}>
            <div className="row" style={{ gap: 14, marginBottom: 8 }}><span style={{ width: 32, height: 32, borderRadius: '50%', background: '#0E0E10', color: '#FFC93C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flex: 'none' }}>{i + 1}</span><h2 style={{ fontSize: 20, margin: 0 }}>{s}</h2></div>
            <p className="legal-copy">{d}</p>
          </div>))}</div>
      </div>
    </>
  );
}

export const Privacy = () => <Legal title="Privacy Policy" secs={[
  ['What we collect', 'Your name, email, profile photo, the movies you add, your reviews and your friends list.'],
  ['How we use it', 'To run your diary, show reviews to the friends you choose, and manage your account.'],
  ['Who can see your reviews', 'You, plus any friends you tag on a shared movie post.'],
  ['Movie information', 'Titles and posters come from a third-party movie database and are not owned by MovieMate.'],
  ['Your choices', 'Edit or delete reviews, change your photo, or delete your account at any time.'],
  ['Contact us', 'Questions? Write to moviemate.legal@gmail.com.']]} />;

export const Terms = () => <Legal title="Terms of Service" secs={[
  ['Your account', 'You are responsible for your account and for keeping your password private. Password recovery is not currently available.'],
  ['Your content', 'You own your reviews and let MovieMate show them to the friends you share them with.'],
  ['Respectful use', 'No harassment, spam, or sharing content you do not have the right to share.'],
  ['Movie data', 'Movie details come from a third-party database and may change or be incomplete.'],
  ['Ending your account', 'You can delete your account anytime. We may suspend accounts that break these terms.'],
  ['Changes', 'We may update these terms and will tell you about important changes.']]} />;

export function NotFound() {
  return (
    <div className="w" style={{ paddingTop: 96, textAlign: 'center' }}>
      <img src="/logo.jpeg" alt="" style={{ height: 96, borderRadius: 20 }} />
      <h1 className="h1" style={{ fontSize: 72, marginTop: 24 }}>404</h1>
      <p className="small" style={{ fontSize: 18 }}>This page is not in our collection.</p>
      <Link to="/" className="btn" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', color: '#0E0E10', marginTop: 16 }}>Back to home</Link>
    </div>
  );
}
