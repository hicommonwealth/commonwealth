module.exports = {
  purge: {
    enabled: true,
    layers: ['components', 'utils', 'elements'],
    content: [
      './client/scripts/**/*.ts',
      './static/*.html',
    ],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    fontFamily: {
      sans: ['Calibre', 'sans-serif'],
      serif: ['serif'],
    },
    extend: {
      colors: {
        black: '#262523',
        gray: {
          100: '#E5E5E5',
          400: '#A6A6B1',
          800: '#333236',
          900: '#29282D',
          500: '#000000',
          300: '#F6F6F6',
          700: '#F9FAFE',
        },
      },
      container: {
        padding: '1rem',
        screens: {
          xs: '375px',
          xl: '1140px',
        },
      },
      minHeight: {
        desktop: '710px',
        tabs: '550px',
      },
      maxWidth: {
        '2/4': '50%',
      },
      height: {
        '556': '556px',
        '720': '720px',
        '50-screen': '50vh',
        '65-screen': '65vh',
        '70-screen': '70vh',
        '86-screen': '86vh',
      },
      width: {
        '43-screen': '43vw',
        '50-screen': '50vw',
        '65-screen': '65vw',
        '70-screen': '70vw',
        '86-screen': '86vw',
        '629': '629px',
        '400': '400px',
        '350': '350px',
      },
      backgroundSize: {
        full: '100% 100%',
      },
      backgroundColor: {
        primary: '#F9FAFE',
      },
      borderRadius: {
        '5xl': '2.50rem',
      },
      backgroundImage: (theme) => ({
        'geometric-pattern': "url('/static/img/bg.png')",
        footer: "url('/static/img/footer.png')",
      }),
    },
  },
  variants: {
    extend: { outline: ['hover', 'active'] },
  },
  plugins: [],
};
