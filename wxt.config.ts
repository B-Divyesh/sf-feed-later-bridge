import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Feed Later Bridge',
    description: 'Bring a saved-items RSS or Atom feed into a private, exportable reading queue.',
    version: '1.1.0',
    permissions: ['storage'],
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    action: { default_title: 'Feed Later Bridge' },
    icons: {
      16: 'icon/icon-16.png',
      32: 'icon/icon-32.png',
      48: 'icon/icon-48.png',
      128: 'icon/icon-128.png'
    }
  }
});
