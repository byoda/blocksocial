/** @type {import('tailwindcss').Config} */

import { skeleton } from '@skeletonlabs/tw-plugin';

module.exports = {
    darkMode: 'class',
    content: [
        "./src/**/*.{html,js,svelte,ts}",
        require.resolve('@skeletonlabs/skeleton'),
    ],
    theme: {
        extend: {},
    },
    plugins: [
        skeleton(
          {
            themes: { preset: ['crimson', 'modern',]}
          }
        )
    ],
}