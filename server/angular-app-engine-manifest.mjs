
export default {
  basePath: 'https://zemachin.github.io/bingo-board',
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
