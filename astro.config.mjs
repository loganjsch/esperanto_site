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
        { icon: 'email', label: 'Contact', href: 'mailto:logan@ratatouille.dev' },
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
          label: 'Reference',
          items: [
            { label: 'CLI', slug: 'reference/cli' },
            { label: 'API', slug: 'reference/api' },
            { label: 'Runtime Policies', slug: 'reference/policies' },
            { label: 'Trust & Attestation', slug: 'reference/trust' },
            { label: 'RATS Framework', slug: 'reference/rats' },
            { label: 'Keylime', slug: 'reference/keylime' },
            { label: 'Sigstore / Cosign', slug: 'reference/sigstore' },
            { label: 'Linux IMA', slug: 'reference/ima' },
          ],
        },
      ],
    }),
  ],
});
