;(function iife() {
  const ELEMENT_ID = 'theme-switcher'
  const LOCAL_STORAGE_THEME_KEY = 'theme'
  const DATA_ATTRIBUTE = 'data-theme'
  const DEFAULT_THEME = 'default'

  // [current theme]: next theme
  const THEME_CYCLE_MAP = {
    default: 'choco',
    choco: 'teal-purple',
    'teal-purple': 'dark',
    dark: 'default'
  }

  document.addEventListener('DOMContentLoaded', function (event) {
    const selector = document.getElementById(ELEMENT_ID)

    const setTheme = (theme) => {
      document.documentElement.setAttribute(DATA_ATTRIBUTE, theme)
      localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme)
    }

    const makeCycleTheme = (m) => {
      return function cycleTheme() {
        const currentTheme =
          localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || DEFAULT_THEME
        const nextTheme = m[currentTheme]
        setTheme(nextTheme)
      }
    }

    const initialTheme =
      localStorage.getItem(LOCAL_STORAGE_THEME_KEY) || DEFAULT_THEME
    setTheme(initialTheme)

    const cycleTheme = makeCycleTheme(THEME_CYCLE_MAP)
    selector.addEventListener('click', cycleTheme)
  })
})()
