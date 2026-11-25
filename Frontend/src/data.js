// Shared review and presentation constants. User data comes from the API.
export const QUESTIONS = [
  { k: 'story', l: 'Story', h: 'Is the plot engaging and does it make sense from start to finish?', g: 0 },
  { k: 'writing', l: 'Writing', h: 'Is the dialogue sharp, with no plot holes or cliches?', g: 0 },
  { k: 'originality', l: 'Originality', h: 'Does it offer something fresh, or copy other films?', g: 0 },
  { k: 'theme', l: 'Theme', h: 'Does it have a message or idea that makes you think?', g: 0 },
  { k: 'pacing', l: 'Pacing', h: 'Does it hold your attention, or drag and rush?', g: 1 },
  { k: 'emotion', l: 'Emotion', h: 'Did it make you laugh, tense up or cry?', g: 1 },
  { k: 'tension', l: 'Tension', h: 'Did you want to know what happens next?', g: 1 },
  { k: 'ending', l: 'Ending', h: 'Does the ending feel satisfying and earned?', g: 1 },
  { k: 'acting', l: 'Acting', h: 'Do the performances feel natural and convincing?', g: 2 },
  { k: 'visuals', l: 'Visuals', h: 'Are the cinematography, editing and effects well done?', g: 2 },
  { k: 'sound', l: 'Sound', h: 'Do the music and sound design add to the mood?', g: 2 },
  { k: 'rewatch', l: 'Rewatch', h: 'Would you watch it again or recommend it?', g: 2 },
];
export const GROUPS = [
  { t: 'The story', s: 'Drag the knob or tap the bar. Not sure? Skip it.' },
  { t: 'The feel', s: 'Drag the knob or tap the bar. Not sure? Skip it.' },
  { t: 'The craft', s: 'Last one. Rewatch is the quick gut check.' },
];
export const TAGS = ['Rewatchable', 'Great story', 'Beautiful visuals', 'Slow pace', 'Emotional', 'Mind-bending'];
export const COLORS = ['#FFC93C', '#9AD1C4', '#F2A6B3', '#B5C7F2'];
export const PAL = [['#0f2027', '#2c5364'], ['#1a2a1a', '#5b8c5a'], ['#8a5a2b', '#e0b070'], ['#3a0d0d', '#b03030'], ['#2b1055', '#d96aa7'], ['#0b3d91', '#e63946']];

export const avg = (arr) => {
  const v = arr.filter((x) => typeof x === 'number');
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 10) / 10 : null;
};
const M = (id, title, genre, year, pal) => ({ id, title, genre, year, pal, posterUrl: null });
// Decorative posters used on the authentication screen only.
export const MOVIES = [
  M(1, 'Interstellar', 'Sci-Fi', 2014, 0), M(2, 'Parasite', 'Thriller', 2019, 1), M(3, 'Dune', 'Sci-Fi', 2021, 2),
  M(4, 'Whiplash', 'Drama', 2014, 3), M(5, 'La La Land', 'Musical', 2016, 4), M(6, 'Spider-Verse', 'Animation', 2018, 5),
  M(7, 'Oppenheimer', 'Drama', 2023, 0), M(8, 'Past Lives', 'Romance', 2023, 4), M(9, 'Arrival', 'Sci-Fi', 2016, 1),
  M(10, 'Her', 'Romance', 2013, 3), M(11, 'Blade Runner 2049', 'Sci-Fi', 2017, 2), M(12, 'The Holdovers', 'Comedy', 2023, 5),
  M(13, 'Coco', 'Animation', 2017, 4), M(14, 'Prisoners', 'Thriller', 2013, 0), M(15, 'Drive', 'Crime', 2011, 3),
  M(16, 'Aftersun', 'Drama', 2022, 1), M(17, 'Barbie', 'Comedy', 2023, 4), M(18, 'Joker', 'Drama', 2019, 2),
];
export const BADGES = [{ n: 20, t: '20+' }, { n: 50, t: '50+' }, { n: 100, t: '100+' }];
