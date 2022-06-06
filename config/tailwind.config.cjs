const colors = require('tailwindcss/colors')
const debugBreakpoints = require('../tailwind/plugins/tailwind-debug-breakpoints')

const config = {
  content: [
    './src/includes/components/**/*.njk',
    './src/layouts/**/*.njk',
    './src/pages/**/*.{html,njk}'
  ],
  plugins: [debugBreakpoints],
  theme: {
    extend: {
      colors: {
        gray: colors.gray
      }
    }
  }
}

// console.log('=== Tailwind CSS config ===', config)

module.exports = config
