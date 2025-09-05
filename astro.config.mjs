// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: 'Esperanto',
			customCss: [
				// Relative path to your custom CSS file
				'./src/styles/custom.css',
			],
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			sidebar: [
				{ 
					label: 'Overview', slug: 'esperanto_overview' 
				},
				{ 
					label: 'Remote Attestation', slug: 'ra_overview' 
				},
				{
					label: 'Usecases', slug: 'usecases' 
				},
				{ 
					label: 'Demo', slug: 'demo' 
				},
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Quickstart Guide', slug: 'guides/quickstart' },
					],
				},
				{
					label: 'Reference',
					items: [
						{ label: 'ref1', slug: 'reference/ref1' },
						{ label: 'ref2', slug: 'reference/ref2' },
						{ label: 'ref3', slug: 'reference/ref3' },

					]
				},
			],
		}),
	],
});
