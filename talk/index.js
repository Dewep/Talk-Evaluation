import courses from './courses/index.js'

const slides = {}

for (const slide of courses.navigation) {
  const Slide = (await import(`./courses/${slide}/index.js`)).default
  slides[slide] = new Slide(slide)
  await slides[slide].load()
}

export default {
  ...courses,
  currentSlide: courses.navigation[0],
  slides
}
