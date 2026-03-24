// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: '🐀 Ratatouille',
      description: 'Continuous TPM-backed platform integrity attestation. Platform Trust at Any Scale.',
      customCss: ['./src/styles/custom.css'],
      social: [
        { icon: 'email', label: 'Contact', href: 'mailto:loganjsch@gmail.com' },
      ],
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#070c0a',
          },
        },
      ],
      sidebar: [
        {
          label: 'Overview',
          items: [
            { label: '← Back to ratatouille.dev', link: '/' },
            { label: 'What is Ratatouille?', slug: 'esperanto_overview' },
            { label: 'Remote Attestation Primer', slug: 'ra_overview' },
            { label: 'Use Cases', slug: 'usecases' },
          ],
        },
        {
          label: 'Getting Started',
          items: [
            { label: 'Quickstart Guide', slug: 'guides/quickstart' },
          ],
        },
        {
          label: 'Case Studies',
          items: [
            { label: 'CJIS Compliance', slug: 'compliance/cjis' },
          ],
        },
        {
          label: 'Demo',
          items: [
            { label: 'Live Demo Walkthrough', slug: 'demo' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'Runtime Policies', slug: 'reference/policies' },
            { label: 'Trust & Attestation', slug: 'reference/trust' },
            { label: 'RATS Framework', slug: 'reference/rats' },
          ],
        },
      ],
    }),
  ],
});
