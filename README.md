# [WIP] fbi-next

`npx fbi [command] [options]`

## Dev

```bash
yarn
npx lerna bootstrap
npx fbi-cli commit --local
```

## Prod

```bash
npx fbi commit
```

## Commands

- `create`: create a new project via templates
  - templates:
    - react
    - vue
    - vue2
- `serve`: starts a dev (or static) server
  - vite
  - webpack
- `build`: produces a production-ready bundle
  - rollup
  - webpack
- `release`: package release
- `commit`: git commit
- `lint`: eslint
- `format`: code format(standard)
- `test`?: unit tests

## Configs

migrate from https://github.com/fbi-js/config
