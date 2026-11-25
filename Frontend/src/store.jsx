import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, TOKEN_KEY_NAME } from './api.js';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

const settingsDefault = { tagged: true, friendReviews: true, friendRequests: true, email: false, seeMovies: 'friends', canTag: 'friends' };
const asUser = (u) => ({ ...u, avatar: u.avatarUrl || null });
const asMovie = (m) => ({ ...m, genre: m.genre || m.genres?.[0] || '', posterUrl: m.posterUrl || null, pal: 0 });

export function StoreProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY_NAME));
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY_NAME)));
  const [error, setError] = useState('');
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState({});
  const [movies, setMovies] = useState({});
  const [entries, setEntries] = useState([]);
  const [watchedCount, setWatchedCount] = useState(0);
  const [waitlist, setWaitlist] = useState([]);
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [badges, setBadges] = useState([]);
  const [settings, setSettings] = useState(settingsDefault);
  const [requestIds, setRequestIds] = useState({});

  const execute = useCallback(async (action) => {
    setError('');
    try {
      return await action();
    } catch (e) {
      if (e.status === 401) {
        localStorage.removeItem(TOKEN_KEY_NAME);
        setToken(null);
        setAuth(false);
        setMe(null);
      }
      setError(e.message || 'Something went wrong. Please try again.');
      return null;
    }
  }, []);

  const rememberUsers = useCallback((list) => {
    setUsers((old) => Object.assign({}, old, ...list.filter(Boolean).map((u) => ({ [u.id]: asUser(u) }))));
  }, []);

  const loadData = useCallback(async (authToken, currentId = me?.id) => {
    const [entryData, pendingData, waitlistData, friendData, notificationData, settingData, summaryData] = await Promise.all([
      api('/entries?limit=100', { token: authToken }),
      api('/entries/pending', { token: authToken }),
      api('/waitlist', { token: authToken }),
      api('/friends', { token: authToken }),
      api('/notifications', { token: authToken }),
      api('/me/settings', { token: authToken }),
      api('/me/summary', { token: authToken }),
    ]);

    const userMap = new Map();
    const movieMap = {};
    const allEntries = [...(entryData.entries || []), ...(pendingData.entries || [])];
    const mappedEntries = allEntries.map((entry) => {
      const movie = asMovie(entry.movie);
      movieMap[movie.id] = movie;
      entry.participants.forEach((p) => userMap.set(p.id, p));
      const mapId = (id) => id === currentId ? 'me' : id;
      return {
        id: entry.id,
        movieId: movie.id,
        owner: mapId(entry.owner),
        participants: entry.participants.map((p) => mapId(p.id)),
        date: entry.watchedOn,
        reviews: Object.fromEntries(Object.entries(entry.reviews).map(([id, review]) => [mapId(id), review])),
      };
    });
    const waitlistMovies = (waitlistData.movies || []).map(asMovie);
    waitlistMovies.forEach((m) => { movieMap[m.id] = m; });

    const friendUsers = (friendData.friends || []).map((u) => asUser(u));
    const requestMap = {};
    const requestUsers = (friendData.requests || []).map((request) => {
      requestMap[request.user.id] = request.friendshipId;
      return asUser(request.user);
    });
    rememberUsers([...userMap.values(), ...friendUsers, ...requestUsers]);
    setMovies((old) => ({ ...old, ...movieMap }));
    setEntries(mappedEntries);
    setWaitlist(waitlistMovies.map((m) => m.id));
    setFriends(friendUsers.map((u) => u.id));
    setRequests(requestUsers.map((u) => u.id));
    setRequestIds(requestMap);
    setNotifications((notificationData.notifications || []).map((n) => ({
      ...n,
      actorId: n.actor?.id || null,
      actor: n.actor?.name || 'Someone',
      badge: n.badge || 'MovieMate',
      time: new Date(n.createdAt).toLocaleString(),
    })));
    setBadges(summaryData.badges || []);
    setWatchedCount(Number(summaryData.watched) || 0);
    setSettings(settingData.settings);
  }, [me?.id, rememberUsers]);

  const acceptSession = useCallback(async (data) => {
    const newToken = data.token;
    localStorage.setItem(TOKEN_KEY_NAME, newToken);
    setToken(newToken);
    const currentUser = asUser(data.user);
    setMe(currentUser);
    setUsers((old) => ({ ...old, [currentUser.id]: currentUser }));
    setAuth(true);
    setLoading(true);
    try {
      await loadData(newToken, currentUser.id);
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setAuth(false);
      return;
    }
    let active = true;
    setLoading(true);
    api('/me', { token }).then(async ({ user }) => {
      if (!active) return;
      const currentUser = asUser(user);
      setMe(currentUser);
      setUsers((old) => ({ ...old, [currentUser.id]: currentUser }));
      setAuth(true);
      await loadData(token, currentUser.id);
    }).catch((e) => {
      if (!active) return;
      if (e.status === 401) {
        localStorage.removeItem(TOKEN_KEY_NAME);
        setToken(null);
      }
      setAuth(false);
      setError(e.message || 'Could not load your account.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, loadData]);

  const login = async (email, password) => {
    try {
      setError('');
      const data = await api('/auth/login', { method: 'POST', body: { email, password }, token: null });
      await acceptSession(data);
      return data;
    } catch (e) {
      setError(e.message || 'Could not log in.');
      return null;
    }
  };
  const signUp = (details) => execute(async () => {
    const data = await api('/auth/signup', { method: 'POST', body: details, token: null });
    await acceptSession(data);
    return data;
  });
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY_NAME);
    setToken(null);
    setAuth(false);
    setMe(null);
    setUsers({});
    setMovies({});
    setEntries([]);
    setWatchedCount(0);
    setWaitlist([]);
    setFriends([]);
    setRequests([]);
    setNotifications([]);
    setBadges([]);
  };
  const user = (id) => id === 'me' ? me : users[id] || { id, name: 'MovieMate member', username: 'member', avatar: null };
  const movie = (id) => movies[id] || null;
  const myEntries = entries.filter((entry) => entry.reviews.me);
  const refreshEntries = async () => {
    const [reviewed, pending] = await Promise.all([api('/entries?limit=100'), api('/entries/pending')]);
    const currentId = me?.id;
    const foundMovies = {};
    const mapped = [...(reviewed.entries || []), ...(pending.entries || [])].map((entry) => {
      const m = asMovie(entry.movie);
      foundMovies[m.id] = m;
      rememberUsers(entry.participants);
      const mapId = (id) => id === currentId ? 'me' : id;
      return {
        id: entry.id, movieId: m.id, owner: mapId(entry.owner),
        participants: entry.participants.map((p) => mapId(p.id)), date: entry.watchedOn,
        reviews: Object.fromEntries(Object.entries(entry.reviews).map(([id, review]) => [mapId(id), review])),
      };
    });
    setMovies((old) => ({ ...old, ...foundMovies }));
    setEntries(mapped);
    return mapped;
  };
  const addEntry = (selectedMovie, withIds) => execute(async () => {
    const data = await api('/entries', { method: 'POST', body: { movie: selectedMovie, with: withIds } });
    if (data.skipped?.length) setError(`Could not tag: ${data.skipped.join(', ')}.`);
    return data.id;
  });
  const saveReview = (entryId, review) => execute(async () => {
    await api(`/entries/${entryId}/review`, { method: 'PUT', body: review });
    const [, notificationData, summaryData, waitlistData] = await Promise.all([
      refreshEntries(),
      api('/notifications'),
      api('/me/summary'),
      api('/waitlist'),
    ]);
    const waitlistMovies = (waitlistData.movies || []).map(asMovie);
    setMovies((old) => ({ ...old, ...Object.fromEntries(waitlistMovies.map((m) => [m.id, m])) }));
    setWaitlist(waitlistMovies.map((m) => m.id));
    setNotifications((notificationData.notifications || []).map((n) => ({
      ...n,
      actorId: n.actor?.id || null,
      actor: n.actor?.name || 'Someone',
      badge: n.badge || 'MovieMate',
      time: new Date(n.createdAt).toLocaleString(),
    })));
    setBadges(summaryData.badges || []);
    setWatchedCount(Number(summaryData.watched) || 0);
    return true;
  });
  const addToWaitlist = (selectedMovie) => execute(async () => {
    const { movie: saved } = await api('/waitlist', { method: 'POST', body: { movie: selectedMovie } });
    const m = asMovie(saved);
    setMovies((old) => ({ ...old, [m.id]: m }));
    setWaitlist((old) => old.includes(m.id) ? old : [m.id, ...old]);
    return m.id;
  });
  const removeFromWaitlist = (id) => execute(async () => {
    await api(`/waitlist/${id}`, { method: 'DELETE' });
    setWaitlist((old) => old.filter((movieId) => movieId !== id));
  });
  const answerRequest = (id, accept) => execute(async () => {
    const friendshipId = requestIds[id];
    if (!friendshipId) return null;
    try {
      await api(`/friends/${friendshipId}/${accept ? 'accept' : 'decline'}`, { method: 'POST' });
    } catch (e) {
      if (e.status === 404 || e.status === 409) await loadData(token);
      throw e;
    }
    setRequests((old) => old.filter((userId) => userId !== id));
    if (accept) setFriends((old) => [...old, id]);
    setRequestIds((old) => { const next = { ...old }; delete next[id]; return next; });
    setNotifications((old) => old.map((n) => n.type === 'friend_request' && n.actorId === id
      ? { ...n, friendshipStatus: accept ? 'accepted' : 'declined', read: true }
      : n));
    return true;
  });
  const sendFriendRequest = (username) => execute(async () => {
    const data = await api('/friends/request', { method: 'POST', body: { username } });
    if (data.status === 'accepted') await loadData(token);
    return data;
  });
  const markRead = (id) => execute(async () => {
    await api(`/notifications/${id}/read`, { method: 'POST' });
    setNotifications((old) => old.map((n) => n.id === id ? { ...n, read: true } : n));
    return true;
  });
  const markAllRead = () => execute(async () => {
    await api('/notifications/read-all', { method: 'POST' });
    setNotifications((old) => old.map((n) => ({ ...n, read: true })));
    return true;
  });
  const updateProfile = (patch) => execute(async () => {
    const { user: saved } = await api('/me', { method: 'PATCH', body: { name: patch.name, username: patch.username, avatarUrl: patch.avatar } });
    const currentUser = asUser(saved);
    setMe(currentUser);
    setUsers((old) => ({ ...old, [currentUser.id]: currentUser }));
    return true;
  });
  const updateSettings = (patch) => execute(async () => {
    const { settings: saved } = await api('/me/settings', { method: 'PUT', body: patch });
    setSettings(saved);
    return true;
  });
  const changePassword = (current, next) => execute(async () => {
    await api('/me/password', { method: 'POST', body: { current, next } });
    return true;
  });
  const deleteAccount = (password) => execute(async () => {
    await api('/me', { method: 'DELETE', body: { password } });
    logout();
    return true;
  });

  const value = {
    auth, loading, error, clearError: () => setError(''), token, me, user, movie,
    entries, myEntries, watchedCount, waitlist, friends, requests, notifications, badges, settings,
    login, signUp, logout, addEntry, saveReview, addToWaitlist, removeFromWaitlist, answerRequest,
    sendFriendRequest, markRead, markAllRead, updateProfile, updateSettings, changePassword, deleteAccount,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
