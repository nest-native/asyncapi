import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'introduction',
        'why-native',
        'quick-start',
        'adoption-guide',
      ],
    },
    {
      type: 'category',
      label: 'Core API',
      items: [
        'decorators',
        'document-generation',
        'docs-route',
        'bindings',
        'api-reference',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'validation',
        'migration',
      ],
    },
    {
      type: 'category',
      label: 'Samples',
      items: [
        'samples/index',
        'samples/catalog',
      ],
    },
    {
      type: 'category',
      label: 'Project Reference',
      items: [
        'support-policy',
        'quality-and-ci',
        'security',
        'release',
        'contributing',
        'roadmap',
      ],
    },
  ],
};

export default sidebars;
