const canvas = Snap.select("#canvas")

pages.addEventListener('dragenter', onDrag)
pages.addEventListener('dragover', onDrag)
pages.addEventListener('drop', onDrop)

document.querySelectorAll(".page").forEach((page, i) => {
  page.addEventListener("click", () => {
    selectPage(i)
  })
})

selectPage(0)

function onDrag(e) {
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
}

function onDrop(e) {
  e.preventDefault()
  const url = e.dataTransfer.getData("url")
  canvas.children().forEach(child => child.remove())
  loadGlass(url)
}

function loadGlass(url) {
  Snap.load(url, (template) => {
    const glass = template.select("svg")
    canvas.append(glass)
    render(glass)
  })
}

function render(glass) {
  /* const mixers = glass.select("#mixers")
  const layer = glass.rect(0, 10, 100, 50).attr({
    fill: "slategray",
  })
  mixers.append(layer) */
}

function selectPage(activeIndex) {
  pages.querySelectorAll(".page").forEach((page, i) => {
    const ri = i - activeIndex
    const ni = -Math.abs(ri)

    const plusMinursOne = Math.random() * 2 - 1

    const left = ri * 12 + "mm"
    const top = plusMinursOne + "mm"
    const transform = `rotateZ(${plusMinursOne}deg) translateZ(${ni}mm)`

    Object.assign(page.style, { left, top, transform })

    page.classList.remove("active", "left", "right")
    if (ri === 0) {
      page.classList.add("active")
      page.appendChild(canvas.node)
    } else {
      page.classList.add(ri < 0 ? "left" : "right")
    }
  })
}