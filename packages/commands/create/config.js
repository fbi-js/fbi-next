const { join } = require('path')
const normalize = require('normalize-path')

const templateDir = normalize(join(__dirname, 'templates'))
// https://github.com/terkelg/prompts#selectmessage-choices-initial-hint-warn
const templates = [
  {
    title: 'React',
    value: 'react',
    description: 'Scaffolds a React.js application',
    path: join(templateDir, 'react')
  },
  {
    title: 'Vue 2.x',
    value: 'vue2',
    description: 'Scaffolds a Vue.js 2.x application',
    path: join(templateDir, 'vue')
  },
  {
    title: 'Vue 3.x',
    value: 'vue',
    description: 'Scaffolds a Vue.js 3.x application',
    path: join(templateDir, 'vue')
  },
  {
    title: 'Single package',
    value: 'single-pkg',
    description: 'Scaffolds a single package application',
    path: join(templateDir, 'single-pkg')
  },
  {
    title: 'Multiple packages',
    value: 'multi-pkg',
    description: 'Scaffolds a multiple packages application',
    path: join(templateDir, 'multi-pkg'),
    // https://github.com/terkelg/prompts#multiselectmessage-choices-initial-max-hint-warn
    features: [
      {
        title: 'Typescript',
        value: 'typescript',
        description: 'xxxx',
        selected: true
      }
    ],
    templates: [
      {
        title: 'Package',
        value: 'pkg',
        description: 'Scaffolds a package application',
        path: join(templateDir, 'pkg')
      }
    ],
    globIgnore (data) {
      return !data.features.includes('typescript')
        ? ['tsconfig.json', 'tsconfig.build.json']
        : []
    }
  }
]

module.exports = {
  templates
}
