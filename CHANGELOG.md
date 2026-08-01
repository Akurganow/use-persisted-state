# Changelog

## [1.4.5](https://github.com/Akurganow/use-persisted-state/compare/v1.4.4...v1.4.5) (2026-08-01)

### Bug Fixes

* keep a caller-supplied __proto__ key in adapter maps ([8bbefba](https://github.com/Akurganow/use-persisted-state/commit/8bbefbafe7b260a771618973348cc3be6ed44361))
* name this library in the error a write propagates ([3c1ff0d](https://github.com/Akurganow/use-persisted-state/commit/3c1ff0db598a9524f010653a47a617ebf2ce9bf7))
* propagate storage write failures ([cc91f26](https://github.com/Akurganow/use-persisted-state/commit/cc91f26da63bfaf2d153857cd8046113fcec114d))
* reset state for every removal event ([a9c62e5](https://github.com/Akurganow/use-persisted-state/commit/a9c62e518cf1049cd021003b48ca9f895d21e8fd))
* stop reporting a removal that removed nothing ([061dd82](https://github.com/Akurganow/use-persisted-state/commit/061dd82e5358518d16134af8d7def455af4e8b01))
* validate shared storage entries ([8509594](https://github.com/Akurganow/use-persisted-state/commit/85095942faca965be4d4cf9babad9f60b3cbb6f9))

## [1.4.4](https://github.com/Akurganow/use-persisted-state/compare/v1.4.3...v1.4.4) (2026-08-01)

### Bug Fixes

* use each async key's initial value ([cc98333](https://github.com/Akurganow/use-persisted-state/commit/cc98333ceb7360ae215fdcc8574c81d135fc99c8))

## [1.4.3](https://github.com/Akurganow/use-persisted-state/compare/v1.4.2...v1.4.3) (2026-08-01)

### Bug Fixes

* apply all storage change events ([8074da0](https://github.com/Akurganow/use-persisted-state/commit/8074da04d82646295cc55d05ee764ae13d5bdde1))

## [1.4.2](https://github.com/Akurganow/use-persisted-state/compare/v1.4.1...v1.4.2) (2026-08-01)

### Bug Fixes

* **chrome-storage:** call chrome.storage in its promise form ([864c759](https://github.com/Akurganow/use-persisted-state/commit/864c7595e6e9a2cff7dd1edffddfdf0539f11001))

## [1.4.1](https://github.com/Akurganow/use-persisted-state/compare/v1.4.0...v1.4.1) (2026-08-01)

### Bug Fixes

* order clear() with the writes queued on the same entry ([8d47ef7](https://github.com/Akurganow/use-persisted-state/commit/8d47ef714b7496b9b6f3453a9e22bccbae0b1f1b))
* refuse a write onto a storage entry that cannot be read ([16a33c1](https://github.com/Akurganow/use-persisted-state/commit/16a33c1b3e1504d490ad1e0bac196c5b7bd8c7ad))
* stop concurrent writes on one entry from losing each other ([8af2d12](https://github.com/Akurganow/use-persisted-state/commit/8af2d12c3c08ff26f7ae41e3f2ddf9f26902d5ce))

## [1.4.0](https://github.com/Akurganow/use-persisted-state/compare/v1.3.0...v1.4.0) (2026-07-31)

### Features

* export the storage contract types from the entry point ([608bfaa](https://github.com/Akurganow/use-persisted-state/commit/608bfaaac780d4ddcee78eec51bb1a5bccef1396))
* publish an exports map with ESM wrappers and node10 stubs ([8ed128e](https://github.com/Akurganow/use-persisted-state/commit/8ed128e78c1f2b831496e159a6e6d626817bbed7))

### Bug Fixes

* **chrome-storage:** narrow storage values at the adapter boundary ([fc0ca97](https://github.com/Akurganow/use-persisted-state/commit/fc0ca973be770714f876bbd68934242e035eaea1))
* correct the author name and funding links ([f85a29f](https://github.com/Akurganow/use-persisted-state/commit/f85a29f615a55311407b483fe1ae00c7aa12cc6a))
* drop the storage-read state nothing branches on ([3084f5e](https://github.com/Akurganow/use-persisted-state/commit/3084f5e4d19af872a1827c84472eea1ddaf42755))
* handle a rejected read on the asynchronous mount path ([4203ac2](https://github.com/Akurganow/use-persisted-state/commit/4203ac205ceff90d2ca3c6bee4939aae55a5d065))
* isolate web storage adapter listeners and make imports SSR-safe ([6710aef](https://github.com/Akurganow/use-persisted-state/commit/6710aefee8a45689497ae4415a74ffa1ada1361e))
* keep an empty string a stored value in the web storage adapter ([94932d9](https://github.com/Akurganow/use-persisted-state/commit/94932d9a13e19451ea616632e5cee82f6c358383))
* point the author contact at a live address ([6ec8f96](https://github.com/Akurganow/use-persisted-state/commit/6ec8f96f5f84a64d832780d2e8955bb875f8703c))
* probe a storage's get as a method of that storage ([ebf48a2](https://github.com/Akurganow/use-persisted-state/commit/ebf48a282d0a2709740216f196c908c1aa383179))
* read a foreign entry that is not a keyed object without throwing ([a5ede4f](https://github.com/Akurganow/use-persisted-state/commit/a5ede4f59b84050cd91fbf46b3c79edc51eb9d40))
* require a storage's members to be callable to call it asynchronous ([7349787](https://github.com/Akurganow/use-persisted-state/commit/73497875f0d6978ddc3f7472c74f293a63adec26))
* restore the initial value the hook has now when an entry is removed ([48b5cc0](https://github.com/Akurganow/use-persisted-state/commit/48b5cc07156f22927e7e1ab5ebc04e57ed3d10fa))
* return a persisted null and stop isAsyncStorage writing to storage ([bdd9ec0](https://github.com/Akurganow/use-persisted-state/commit/bdd9ec07ce53624128edfa7657f5486e4d592a8d))
* stop the hook overwriting its own state and reading storage on every render ([256f06d](https://github.com/Akurganow/use-persisted-state/commit/256f06dce7dace4ebc6698795a79846baeeb0343))
* **storages:** ignore storage areas the library does not track ([c4b3c9f](https://github.com/Akurganow/use-persisted-state/commit/c4b3c9f3222ad47c01f2885a6e5bdbf19c81bfb0)), references [#938](https://github.com/Akurganow/use-persisted-state/issues/938)

### Behaviour note: `NaN` and `Infinity`

A stored `NaN` or `Infinity` now reads back as `null` instead of falling back to the initial value.

`JSON.stringify` writes `null`, `NaN` and `Infinity` all as `null`, so the read side cannot tell
them apart. Returning the initial value for `null` was what stopped a genuinely stored `null` from
round-tripping, and fixing that necessarily gives up the fallback for the other two.

This ships in a minor release deliberately. A `NaN` or an `Infinity` reaching storage is a defect in
the calling code; the old fallback did not repair it, it only hid it. If your code can produce
either, guard the value before writing it.

## [1.3.0](https://github.com/Akurganow/use-persisted-state/compare/v1.2.0...v1.3.0) (2025-08-02)

### Features

* add React 19 support and update dependencies ([a6122cf](https://github.com/Akurganow/use-persisted-state/commit/a6122cfbb82a144a8d7e4d246293661312bc81ea))

### Bug Fixes

* address code review comments ([af06897](https://github.com/Akurganow/use-persisted-state/commit/af06897da7114b886c7f0c934bde6dab988a8e96))
* repair examples with interactive controls ([68bfe40](https://github.com/Akurganow/use-persisted-state/commit/68bfe401aa77f8dc27aa13508b9ae4d85881221c))
* resolve TypeScript compatibility issues and update dependencies ([e9944af](https://github.com/Akurganow/use-persisted-state/commit/e9944af4031c046939073a055baf6aa48bea3f1f))
* Support falsy values ([6ef9b63](https://github.com/Akurganow/use-persisted-state/commit/6ef9b631858b9f7c3959a2d96f5bee272abf9295))

## [1.2.0](https://github.com/Akurganow/use-persisted-state/compare/v1.1.5...v1.2.0) (2023-10-09)


### Features

* Move is checks to external package ([a7f7732](https://github.com/Akurganow/use-persisted-state/commit/a7f77328b1fd86ea716143b385d8b3ba18300961))

## [1.1.5](https://github.com/Akurganow/use-persisted-state/compare/v1.1.4...v1.1.5) (2023-10-08)


### Bug Fixes

* package.json peerDependencies and engines ([5e48a2f](https://github.com/Akurganow/use-persisted-state/commit/5e48a2f439a0026ea6b0133852d774b3b42f097a))
* Update gitignore ([2b99bc4](https://github.com/Akurganow/use-persisted-state/commit/2b99bc42e0b2b511aa1a7277cb775fa4de2df631))

## [1.1.4](https://github.com/Akurganow/use-persisted-state/compare/v1.1.3...v1.1.4) (2023-10-08)

## [1.1.3](https://github.com/Akurganow/use-persisted-state/compare/v1.1.2...v1.1.3) (2023-10-08)


### Bug Fixes

* Github actions main job ([4dd9df1](https://github.com/Akurganow/use-persisted-state/commit/4dd9df14fa7db3fdba527faef2d1f61b83c98c99))
* Github actions main job ([839aea7](https://github.com/Akurganow/use-persisted-state/commit/839aea71db9b0423c2aadd301bfb09eaaa01c2aa))
* Github actions main job ([1b40f22](https://github.com/Akurganow/use-persisted-state/commit/1b40f221c6635fbb38c9d9ea4412c18be709b279))
* useStorageHandler missing useEffect deps ([3266ba3](https://github.com/Akurganow/use-persisted-state/commit/3266ba3a80f0ab6449ba9b8ad1ee404e64882b3c))

### [1.1.2](https://github.com/Akurganow/use-persisted-state/compare/v1.1.1...v1.1.2) (2021-02-09)


### Bug Fixes

* **toString:** IE11 fix (TypeError: Invalid calling object) ([1514cd6](https://github.com/Akurganow/use-persisted-state/commit/1514cd6e520a60163b5a834bf337dc679b12530c))

### [1.1.1](https://github.com/Akurganow/use-persisted-state/compare/v1.1.0...v1.1.1) (2020-12-18)

## [1.1.0](https://github.com/Akurganow/use-persisted-state/compare/v1.0.2...v1.1.0) (2020-10-04)


### Features

* Support SSR. Closes [#196](https://github.com/Akurganow/use-persisted-state/issues/196) ([9e17280](https://github.com/Akurganow/use-persisted-state/commit/9e1728038976686f679e4bf867c8150a66d14293))
* Watch key changes. Closes [#187](https://github.com/Akurganow/use-persisted-state/issues/187) ([f3699aa](https://github.com/Akurganow/use-persisted-state/commit/f3699aa46b24c9e55603b2f6c3f705eeb3c78d89))

### [1.0.2](https://github.com/Akurganow/use-persisted-state/compare/v1.0.1...v1.0.2) (2020-06-15)


### Bug Fixes

* **async storage:** setState in set hook ([e287091](https://github.com/Akurganow/use-persisted-state/commit/e287091669e2e40c4fa6d54328df285a920b249a))

### [1.0.1](https://github.com/Akurganow/use-persisted-state/compare/v1.0.0...v1.0.1) (2020-06-14)

## [1.0.0](https://github.com/Akurganow/use-persisted-state/compare/v0.2.5...v1.0.0) (2020-06-14)


### Features

* **examples:** add async storage example ([5377681](https://github.com/Akurganow/use-persisted-state/commit/5377681b5db547fb0add701f49f9ad426e6e36f7))
* **hook:** support async storage ([68195f7](https://github.com/Akurganow/use-persisted-state/commit/68195f7d75dbd58087dd8dc0b38d92c5bbb3837d))
* **storages:** add storages ([9a8640b](https://github.com/Akurganow/use-persisted-state/commit/9a8640b3dbbb50686ff7b286d35b9707af3428ce))

### [0.2.5](https://github.com/Akurganow/use-persisted-state/compare/v0.2.4...v0.2.5) (2020-06-02)


### Bug Fixes

* **clear:** dispatch event with old value ([38e05ef](https://github.com/Akurganow/use-persisted-state/commit/38e05ef77e88bc2de84b2352f63726b60096bad6))

### [0.2.4](https://github.com/Akurganow/use-persisted-state/compare/v0.2.3...v0.2.4) (2020-06-02)


### Bug Fixes

* **storage listener:** listen key remove ([76d4bf5](https://github.com/Akurganow/use-persisted-state/commit/76d4bf5227920e0739fc8292ffc7e657bb03f7c5))

### [0.2.3](https://github.com/Akurganow/use-persisted-state/compare/v0.2.2...v0.2.3) (2020-06-02)


### Bug Fixes

* **storage listener:** check values is not null ([109b7a1](https://github.com/Akurganow/use-persisted-state/commit/109b7a18f433f8b19f1c5e857c6c3021b26a0ad5))

### [0.2.2](https://github.com/Akurganow/use-persisted-state/compare/v0.2.1...v0.2.2) (2020-05-29)

### [0.2.1](https://github.com/Akurganow/use-persisted-state/compare/v0.2.0...v0.2.1) (2020-05-29)


### Bug Fixes

* **init:** don't call setState when init with initialValue ([cb17cfb](https://github.com/Akurganow/use-persisted-state/commit/cb17cfbcdf8731ff7695311b35771c2736a11580))

# [0.2.0](https://github.com/Akurganow/use-persisted-state/compare/v0.1.0...v0.2.0) (2020-05-29)

# [0.1.0](https://github.com/Akurganow/use-persisted-state/compare/v0.0.10...v0.1.0) (2019-09-24)

### Bug Fixes

* **actions:** comand name ([06160e7](https://github.com/Akurganow/use-persisted-state/commit/06160e7))
* **package:** email ([18c2bd3](https://github.com/Akurganow/use-persisted-state/commit/18c2bd3))
* **tests:** button text ([35bd20d](https://github.com/Akurganow/use-persisted-state/commit/35bd20d))
* **check value:** check key in ([9b3ab38](https://github.com/Akurganow/use-persisted-state/commit/9b3ab38))
* **empty key:** check that key in persisted storage ([aae8daa](https://github.com/Akurganow/use-persisted-state/commit/aae8daa))
* **initial value:** move initialPersist into hook ([98eced6](https://github.com/Akurganow/use-persisted-state/commit/98eced6))
* **eslint:** missed plugin ([ea67e59](https://github.com/Akurganow/use-persisted-state/commit/ea67e59))
* **clear:** dispatchEvent after clear ([4177143](https://github.com/Akurganow/use-persisted-state/commit/4177143))
* **example:** add clear ([4f382a0](https://github.com/Akurganow/use-persisted-state/commit/4f382a0))
* **examples:** remove unneded exports ([2dc5759](https://github.com/Akurganow/use-persisted-state/commit/2dc5759))
* **examples:** simplify ([97dca4f](https://github.com/Akurganow/use-persisted-state/commit/97dca4f))
* **examples:** typos ([4a10d2e](https://github.com/Akurganow/use-persisted-state/commit/4a10d2e))

### Features

* **lint:** init ([f54e050](https://github.com/Akurganow/use-persisted-state/commit/f54e050))
* **readme:** add codesandbox example ([d161824](https://github.com/Akurganow/use-persisted-state/commit/d161824))
* **tests:** add clear test ([e119c94](https://github.com/Akurganow/use-persisted-state/commit/e119c94))
