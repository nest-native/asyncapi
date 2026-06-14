import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: '@nest-native/asyncapi',
  tagline: 'Decorator-first AsyncAPI 3.0 documentation for NestJS event-driven services — the AsyncAPI counterpart to @nestjs/swagger',
  favicon: 'img/logo.svg',

  future: {
    v4: true,
  },

  url: 'https://nest-native.github.io',
  baseUrl: '/asyncapi/',

  organizationName: 'nest-native',
  projectName: 'asyncapi',

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/nest-native/asyncapi/tree/main/website/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/social-card.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: '@nest-native/asyncapi',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          href: 'https://www.npmjs.com/package/@nest-native/asyncapi',
          label: 'npm',
          position: 'right',
        },
        {
          href: 'https://github.com/nest-native/asyncapi',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Introduction', to: '/docs/introduction'},
            {label: 'Quick Start', to: '/docs/quick-start'},
            {label: 'Decorators', to: '/docs/decorators'},
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/nest-native/asyncapi',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/@nest-native/asyncapi',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} @nest-native/asyncapi contributors. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
