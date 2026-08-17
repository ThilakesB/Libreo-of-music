export interface AlbumData {
  id: string;
  title: string;
  artist: string;
  youtubeId: string;
  albumCover: string;
  albumName?: string;
  year?: number;
}

// Local database of top 50 trending songs - covers loaded dynamically from iTunes API
// Fast loading with real Apple Music artwork - Last update: December 2024
export const ALBUMS_DATABASE: AlbumData[] = [
  // #1-10
  {
    id: '1',
    title: 'Anti-Hero',
    artist: 'Taylor Swift',
    youtubeId: 'b1kbLWvqugk',
    albumName: 'Midnights',
    year: 2022,
    albumCover: '' // Loaded dynamically from iTunes API
  },
  {
    id: '2',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    youtubeId: 'G7KNmW9a75Y',
    albumName: 'Endless Summer Vacation',
    year: 2023,
    albumCover: ''
  },
  {
    id: '3',
    title: 'Unholy',
    artist: 'Sam Smith',
    youtubeId: 'Uq9gPaIzbe8',
    albumName: 'Gloria',
    year: 2023,
    albumCover: ''
  },
  {
    id: '4',
    title: 'As It Was',
    artist: 'Harry Styles',
    youtubeId: 'H5v3kku4y6Q',
    albumName: "Harry's House",
    year: 2022,
    albumCover: ''
  },
  {
    id: '5',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    youtubeId: 'mRD0-GxqHVo',
    albumName: 'Dreamland',
    year: 2020,
    albumCover: ''
  },
  {
    id: '6',
    title: 'Stay',
    artist: 'The Kid LAROI',
    youtubeId: 'kTJczUoc26U',
    albumName: 'F*CK LOVE 3: OVER YOU',
    year: 2021,
    albumCover: ''
  },
  {
    id: '7',
    title: 'Industry Baby',
    artist: 'Lil Nas X',
    youtubeId: 'UTHLKHL_whs',
    albumName: 'MONTERO',
    year: 2021,
    albumCover: ''
  },
  {
    id: '8',
    title: 'Good 4 U',
    artist: 'Olivia Rodrigo',
    youtubeId: 'gNi_6U5Pm_o',
    albumName: 'SOUR',
    year: 2021,
    albumCover: ''
  },
  {
    id: '9',
    title: 'Levitating',
    artist: 'Dua Lipa',
    youtubeId: 'TUVcZfQe-Kw',
    albumName: 'Future Nostalgia',
    year: 2020,
    albumCover: ''
  },
  {
    id: '10',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    youtubeId: '4NRXx6U8ABQ',
    albumName: 'After Hours',
    year: 2020,
    albumCover: ''
  },

  // #11-20
  {
    id: '11',
    title: 'Peaches',
    artist: 'Justin Bieber',
    youtubeId: 'tQ0yjYUFKAE',
    albumName: 'Justice',
    year: 2021,
    albumCover: ''
  },
  {
    id: '12',
    title: 'Watermelon Sugar',
    artist: 'Harry Styles',
    youtubeId: 'E07s5ZYygMg',
    albumName: 'Fine Line',
    year: 2019,
    albumCover: ''
  },
  {
    id: '13',
    title: 'Bad Habit',
    artist: 'Steve Lacy',
    youtubeId: 'VF-r5TtlT9w',
    albumName: 'Gemini Rights',
    year: 2022,
    albumCover: ''
  },
  {
    id: '14',
    title: 'About Damn Time',
    artist: 'Lizzo',
    youtubeId: 'nQwbnAdee5I',
    albumName: 'Special',
    year: 2022,
    albumCover: ''
  },
  {
    id: '15',
    title: 'Running Up That Hill',
    artist: 'Kate Bush',
    youtubeId: 'wp43OdtAAkM',
    albumName: 'Hounds of Love',
    year: 1985,
    albumCover: ''
  },
  {
    id: '16',
    title: 'First Class',
    artist: 'Jack Harlow',
    youtubeId: 'XHbAOLLl6lg',
    albumName: 'Come Home the Kids Miss You',
    year: 2022,
    albumCover: ''
  },
  {
    id: '17',
    title: 'Break My Soul',
    artist: 'Beyoncé',
    youtubeId: 'yjki-9Pthh0',
    albumName: 'Renaissance',
    year: 2022,
    albumCover: ''
  },
  {
    id: '18',
    title: 'Super Gremlin',
    artist: 'Kodak Black',
    youtubeId: 'aYNmZoxp3Z8',
    albumName: 'Back for Everything',
    year: 2022,
    albumCover: ''
  },
  {
    id: '19',
    title: 'Woman',
    artist: 'Doja Cat',
    youtubeId: 'aOUkWoXXgTE',
    albumName: 'Planet Her',
    year: 2021,
    albumCover: ''
  },
  {
    id: '20',
    title: 'Shivers',
    artist: 'Ed Sheeran',
    youtubeId: 'Il0S8BoucSA',
    albumName: '=',
    year: 2021,
    albumCover: ''
  },

  // #21-30
  {
    id: '21',
    title: 'Ghost',
    artist: 'Justice',
    youtubeId: 'Jrg9KxGNeJY',
    albumName: 'Cross',
    year: 2007,
    albumCover: ''
  },
  {
    id: '22',
    title: 'Dynamite',
    artist: 'BTS',
    youtubeId: 'gdZLi9oWNZg',
    albumName: 'BE',
    year: 2020,
    albumCover: ''
  },
  {
    id: '23',
    title: 'Savage',
    artist: 'Megan Thee Stallion',
    youtubeId: 'EOxj2ROIxok',
    albumName: 'Good News',
    year: 2020,
    albumCover: ''
  },
  {
    id: '24',
    title: 'Mood',
    artist: '24kGoldn',
    youtubeId: 'GGGu4ceFMe4',
    albumName: 'El Dorado',
    year: 2021,
    albumCover: ''
  },
  {
    id: '25',
    title: 'Positions',
    artist: 'Ariana Grande',
    youtubeId: 'tcYodQoapMg',
    albumName: 'Positions',
    year: 2020,
    albumCover: ''
  },
  {
    id: '26',
    title: 'Drivers License',
    artist: 'Olivia Rodrigo',
    youtubeId: 'ZmDBbnmKpqQ',
    albumName: 'SOUR',
    year: 2021,
    albumCover: ''
  },
  {
    id: '27',
    title: 'Therefore I Am',
    artist: 'Billie Eilish',
    youtubeId: 'RUQl6YcMalg',
    albumName: 'Happier Than Ever',
    year: 2021,
    albumCover: ''
  },
  {
    id: '28',
    title: 'Rockstar',
    artist: 'DaBaby',
    youtubeId: 'mxFstYSbBmc',
    albumName: 'Blame It on Baby',
    year: 2020,
    albumCover: ''
  },
  {
    id: '29',
    title: 'Circles',
    artist: 'Post Malone',
    youtubeId: 'wXhTHyIgQ_U',
    albumName: "Hollywood's Bleeding",
    year: 2019,
    albumCover: ''
  },
  {
    id: '30',
    title: 'Deja Vu',
    artist: 'Olivia Rodrigo',
    youtubeId: '_D8PbAqPL0E',
    albumName: 'SOUR',
    year: 2021,
    albumCover: ''
  },

  // #31-40
  {
    id: '31',
    title: 'Montero',
    artist: 'Lil Nas X',
    youtubeId: '6swmTBVI83k',
    albumName: 'MONTERO',
    year: 2021,
    albumCover: ''
  },
  {
    id: '32',
    title: 'Traitor',
    artist: 'Olivia Rodrigo',
    youtubeId: 'EiAcDuoyT4U',
    albumName: 'SOUR',
    year: 2021,
    albumCover: ''
  },
  {
    id: '33',
    title: 'Kiss Me More',
    artist: 'Doja Cat',
    youtubeId: '0EVVKs6DQLo',
    albumName: 'Planet Her',
    year: 2021,
    albumCover: ''
  },
  {
    id: '34',
    title: 'We Dont Talk About Bruno',
    artist: 'Encanto Cast',
    youtubeId: 'bvWRMAU6V-c',
    albumName: 'Encanto',
    year: 2021,
    albumCover: ''
  },
  {
    id: '35',
    title: 'Surface Pressure',
    artist: 'Jessica Darrow',
    youtubeId: '8-8GGZ1AsLs',
    albumName: 'Encanto',
    year: 2021,
    albumCover: ''
  },
  {
    id: '36',
    title: 'Easy On Me',
    artist: 'Adele',
    youtubeId: 'X-yIEMduRXk',
    albumName: '30',
    year: 2021,
    albumCover: ''
  },
  {
    id: '37',
    title: 'My Universe',
    artist: 'Coldplay',
    youtubeId: '3YqPKLZF_WU',
    albumName: 'Music of the Spheres',
    year: 2021,
    albumCover: ''
  },
  {
    id: '38',
    title: 'Good Ones',
    artist: 'Charli XCX',
    youtubeId: 'r3gEPyqLk_I',
    albumName: 'CRASH',
    year: 2022,
    albumCover: ''
  },
  {
    id: '39',
    title: 'Beggin',
    artist: 'Måneskin',
    youtubeId: 'RVH5dn1cxAQ',
    albumName: 'Teatro d\'ira: Vol. I',
    year: 2021,
    albumCover: ''
  },
  {
    id: '40',
    title: 'Bad Habits',
    artist: 'Ed Sheeran',
    youtubeId: 'orJSJGHjBLI',
    albumName: '=',
    year: 2021,
    albumCover: ''
  },

  // #41-50
  {
    id: '41',
    title: 'Happier Than Ever',
    artist: 'Billie Eilish',
    youtubeId: '5GJWxDKyk3A',
    albumName: 'Happier Than Ever',
    year: 2021,
    albumCover: ''
  },
  {
    id: '42',
    title: 'Love Nwantiti',
    artist: 'CKay',
    youtubeId: 'doLMt10ytHY',
    albumName: 'Boyfriend',
    year: 2022,
    albumCover: ''
  },
  {
    id: '43',
    title: 'Good as Hell',
    artist: 'Lizzo',
    youtubeId: 'SmbmeOgWsqE',
    albumName: 'Cuz I Love You',
    year: 2019,
    albumCover: ''
  },
  {
    id: '44',
    title: 'Brutal',
    artist: 'Olivia Rodrigo',
    youtubeId: '_D8PbAqPL0E',
    albumName: 'SOUR',
    year: 2021,
    albumCover: ''
  },
  {
    id: '45',
    title: 'Need to Know',
    artist: 'Doja Cat',
    youtubeId: 'rZsGc3h3PhY',
    albumName: 'Planet Her',
    year: 2021,
    albumCover: ''
  },
  {
    id: '46',
    title: 'Butter',
    artist: 'BTS',
    youtubeId: 'WMweEpGlu_U',
    albumName: 'Butter',
    year: 2021,
    albumCover: ''
  },
  {
    id: '47',
    title: 'Permission to Dance',
    artist: 'BTS',
    youtubeId: 'CuklIb9d3fI',
    albumName: 'Butter',
    year: 2021,
    albumCover: ''
  },
  {
    id: '48',
    title: 'Glimpse of Us',
    artist: 'Joji',
    youtubeId: 'FjHGZj2IjBk',
    albumName: 'SMITHEREENS',
    year: 2022,
    albumCover: ''
  },
  {
    id: '49',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    youtubeId: 'gKIlLmUsoL8',
    albumName: 'Short n Sweet',
    year: 2024,
    albumCover: ''
  },
  {
    id: '50',
    title: 'Vampire',
    artist: 'Olivia Rodrigo',
    youtubeId: 'RlPNh_PBZb4',
    albumName: 'GUTS',
    year: 2023,
    albumCover: ''
  }
];

// Helper functions for database operations
export const getAlbumById = (id: string): AlbumData | undefined => {
  return ALBUMS_DATABASE.find(album => album.id === id);
};

export const getAlbumsByArtist = (artist: string): AlbumData[] => {
  return ALBUMS_DATABASE.filter(album => 
    album.artist.toLowerCase().includes(artist.toLowerCase())
  );
};

export const searchAlbums = (query: string): AlbumData[] => {
  const lowerQuery = query.toLowerCase();
  return ALBUMS_DATABASE.filter(album =>
    album.title.toLowerCase().includes(lowerQuery) ||
    album.artist.toLowerCase().includes(lowerQuery) ||
    (album.albumName && album.albumName.toLowerCase().includes(lowerQuery))
  );
};

export const getAllAlbums = (): AlbumData[] => {
  return ALBUMS_DATABASE;
};

// Get random subset of albums
export const getRandomAlbums = (count: number): AlbumData[] => {
  const shuffled = [...ALBUMS_DATABASE].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};