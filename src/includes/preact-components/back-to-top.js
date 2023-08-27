import {
  html,
  render,
  useEffect,
  useState
} from 'https://unpkg.com/htm/preact/standalone.module.js'

// When the user clicks on the button, scroll to the top of the document
const scrollToTop = (event) => {
  document.body.scrollTop = 0 // For Safari
  document.documentElement.scrollTop = 0 // For Chrome, Firefox, IE and Opera
  // document.documentElement.scrollIntoView();
}

const makeHandleScroll = ({ setDisplay, scrollFactor }) => {
  // console.log(`makeHandleScroll`, { scrollFactor, setDisplay })
  return function handleScroll(event) {
    const threshold = document.documentElement.scrollHeight / scrollFactor

    if (
      document.body.scrollTop > threshold ||
      document.documentElement.scrollTop > threshold
    ) {
      setDisplay('block')
    } else {
      setDisplay('none')
    }
  }
}

const BackToTop = (props) => {
  const { onClick, scrollFactor, title } = props

  const [display, setDisplay] = useState('none')
  const handleScroll = makeHandleScroll({ setDisplay, scrollFactor })

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // https://github.com/adamwathan/entypo-optimized/blob/master/dist/icons/align-top.svg
  return html`<button
    id="back-to-top"
    style="display: ${display};"
    title=${title}
    onClick=${onClick}
  >
    <svg xmlns="https://www.w3.org/2000/svg" viewBox="0 0 20 20">
      <path
        d="M10 6L7 9h2v8h2V9h2l-3-3zm8-2c0-.553-.048-1-.6-1H2.6c-.552 0-.6.447-.6 1 0 .553.048 1 .6 1h14.8c.552 0 .6-.447.6-1z"
      />
    </svg>
  </button>`
}

export default function (el) {
  // I pick an arbitrary value for scrollFactor
  render(
    html`<${BackToTop}
      title="Go to top"
      onClick=${scrollToTop}
      scrollFactor=${50.0}
    />`,
    el
  )
}
