const toggleNavbar = (
  collapsibleID = 'navbar-menu',
  openMenuIconID = 'open-menu-icon',
  closeMenuIconID = 'close-menu-icon'
) => {
  ;[collapsibleID, openMenuIconID, closeMenuIconID].forEach((id) => {
    document.getElementById(id).classList.toggle('hidden')
    document.getElementById(id).classList.toggle('block')
  })
}

const hideNavbar = (
  collapsibleID = 'navbar-menu',
  openMenuIconID = 'open-menu-icon',
  closeMenuIconID = 'close-menu-icon'
) => {
  document.getElementById(collapsibleID).classList.add('hidden')
  document.getElementById(collapsibleID).classList.remove('block')
  document.getElementById(closeMenuIconID).classList.add('hidden')
  document.getElementById(closeMenuIconID).classList.remove('block')

  document.getElementById(openMenuIconID).classList.remove('hidden')
  document.getElementById(openMenuIconID).classList.add('block')
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    hideNavbar()
  }
})
