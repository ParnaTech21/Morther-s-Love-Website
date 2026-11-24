import { extendTheme } from '@chakra-ui/react';

// Terracotta accent (kept under the name "plum" so existing pages pick it up)
const clay = { 50: '#fbf3ef', 100: '#f4e0d7', 200: '#e8c1af', 300: '#d99f86', 400: '#c8826a', 500: '#b86a50', 600: '#a15a42', 700: '#834835', 800: '#5f3426', 900: '#3e2218' };

export default extendTheme({
  fonts: { heading: "'Manrope', system-ui, sans-serif", body: "'Manrope', system-ui, sans-serif" },
  colors: {
    plum: clay,
    sage: { 100: '#e6ebe3', 200: '#c9d4c4', 500: '#6b7f64', 700: '#46563f' },
    butter: { 100: '#fbf0cf', 300: '#f2d58b', 500: '#d9a93a' },
  },
  styles: { global: { body: { bg: '#f7f5f3', color: '#1a1a1a' } } },
  // Flat white panel used by forms, reviews and admin pages
  layerStyles: { stitched: { bg: 'white', borderRadius: 'md', border: '1px solid', borderColor: 'blackAlpha.100' } },
  components: {
    Button: { defaultProps: { colorScheme: 'plum' }, baseStyle: { borderRadius: 'none', fontWeight: 600 } },
    Heading: { baseStyle: { fontWeight: 600, letterSpacing: '-0.02em' } },
  },
});
