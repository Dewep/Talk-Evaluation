import fs from 'fs/promises'

class SlideAbstract {
  constructor (slug) {
    this.slug = slug

    this.templateFile = 'template.html'
    this.content = null
  }

  async load () {
    const buffer = await fs.readFile(`./talk/courses/${this.slug}/${this.templateFile}`)
    this.content = buffer.toString()
  }

  format () {
    return {
      slug: this.slug,
      content: this.content
    }
  }
}

export default SlideAbstract
