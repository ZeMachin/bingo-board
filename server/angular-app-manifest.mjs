
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://zemachin.github.io/bingo-board/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/bingo-board"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 1031, hash: '003fbc3eafeca5d952182e1be4be737a962810a94c5c7494682ef2c57dc5d970', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 986, hash: 'd1c4655ec29b6b0d1320375dbd2443aa423b24350f749b9fdbcbd10b228b1221', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 56643, hash: 'fc312a2ad76138211939c87f8cc588dda6454bdf5a52f32ed32e69858e7026ce', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-ACKGILVV.css': {size: 1070, hash: 'qX/XNN95Bus', text: () => import('./assets-chunks/styles-ACKGILVV_css.mjs').then(m => m.default)}
  },
};
