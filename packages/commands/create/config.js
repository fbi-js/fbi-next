const { join } = require('path')
const normalize = require('normalize-path')

const templateDir = normalize(join(__dirname, 'templates'))
const templates = [
  {
    title: 'React',
    value: 'react',
    description: 'Template for React.js application',
    path: join(templateDir, 'react')
  },
  {
    title: 'Vue 2.x',
    value: 'vue2',
    description: 'Template for Vue.js 2.x application',
    path: join(templateDir, 'vue')
  },
  {
    title: 'Vue 3.x',
    value: 'vue',
    description: 'Template for Vue.js 3.x application',
    path: join(templateDir, 'vue')
  }
]

module.exports = {
  templates
}
