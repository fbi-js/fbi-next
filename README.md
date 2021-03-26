# [WIP] fbi-next

`npx fbi [command] [options]`

## Dev

```bash
yarn
npx lerna bootstrap
npx fbi commit --local
```

## Prod

```bash
npx fbi commit
```

## Commands

- [x] `create`: create a new project via templates
  - templates:
    - [x] react
    - [x] vue
    - [x] vue2
    - [x] multi-pkg
    - [ ] single-pkg
- [x] `commit`: git commit
- [x] `format`: code format(standard)
- [ ] `serve`: starts a dev (or static) server
  - vite
  - webpack
- [ ] `build`: produces a production-ready bundle
  - rollup
  - webpack
- [ ] `release`: package release
- [ ] `lint`: eslint
- [ ] `test`?: unit tests

## Configs

migrate from https://github.com/fbi-js/config
