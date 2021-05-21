# Learning Metro Bundler

## Getting started

- Create a test file at `src/index.js`
- Create a build script i.e., `build.js`
  - Uses metro's default configuration
  - Specifies entry and output configurations
  - Note: The folder for the build output should be created first before the build script is run.

## Running Metro

You can run metro in 2 ways:

1. Via CLI
2. Programmatically

  - `runMetro`: Returns a metro server.
  - `runServer`: Starts a server based on the given configurations and options. Returns a metro server.
  - `runBuild`:  Builds a bundle based on config passed.

### General notes when running metro

Metro is a cross platform tool. It serves files with `bundle` extension. Hence, assuming `src/index.js` is our entry point, the server reference should be `http://localhost:8080/src/index.bundle`. _I could only get it to work with port 8080 and not others such as 3000_.

_An initial metro bundle with a single file and a "hello world" console.log is about 21.1kb_.

Metro bundles serves 3 things generally

#### Assets

In the js files, assets can be imported using `require` method as with any other js file. The metro server is also able to serve platform-specific assets eg. ios using @2x naming.

#### Bundle

To metro, any JS file can be the root for a bundle request. Any `require`d would be recursively added. Note the use of `.bundle` if you the server needs to return anything.

### Source maps

Each bundle comes with a source map. It is only flipped off if `inlineSourceMap` is set to `false`.

### Metro and Typescript

Nothing really changes about metro configuration. Metro uses babel to transform JS files. Hence, adding the required babel presets for typescript should be enough for metro to bundle typescript code. You can look at `src/ts-react.tsx`, `tsconfig.json` and `babel.config.js` configuration as well for details.

## Metro Bundling Process

### Why Metro

- Fast: Sub-second *reload time*. Fast today and also tomorrow. 
- Scalable: Reload time stays constant no matter the size of the codebase
- Integrated: Deeply integrated to React Native eg. remote debugger, hot module reloading etc.

### Anatomy of a JS Bundle

The first is the runtime. Making the dependency between the modules work correctly. Then all the transpiled modules. The last bit is the startup code.

- Runtime
  - Register: Basically the define function
  - Require: Loading and evaluation of the modules

### Bundling Process

There are 2 phases. This results in the bundle output

- Build the dependency graph
  - Transform modules: Metro uses babel
    - Parse JS into AST
    - Mutate AST
    - Generate JS & source maps from AST
  - Collect dependencies: Looks for require/import statements. Discover all the modules that should be included in the graph.
  - Resolve dependencies: Metro uses similar algorithm as node.js. However, there are a few additions to make it resolve platform-specific implementations
- Graph Serialization
  - The graph is an input to this step
  - It returns bundles
  - Different serializes
    - Plain JS bundle: uses runtime, modules, startup code are concatenated.
    - Random Access Modules bundle (RAM) - Modules are not just concatenated but stored in a particular format. The format uses a header, table of contents (lookup) and list of modules (separated by null chars).
    - Improvements comes from how/when the js code is injected in the JS VM. With RAM bundles, only runtime and startcode are injected and other modules are lazily injected. It implements by a call to nativeRequire that starts with a lookup in the table of contents and injects it into the JS VM accordingly. The execution of the require continues on the js side. This improves startup time and less memory consumption. To achieve RAM bundles, you use inline requires. We can use a babel plugin that can achieve this automatically.

Example input:
```
import foo from './foo';
import leftpad from 'leftpad';
// ...
```

The first phase is to transform this with babel.

```
const foo = require('./foo');
const leftpad = require('leftpad');
```

Next step is to collect all dependencies:

```
[
  "./foo",
  "leftpad"
]
```

Paths get transformed again. This way, string paths are replaced by module ids.

```
const foo = require(1);
const leftpad = require(2);
```

Finally, metro wraps the transformed code with a define call

```
__d(function (global, _$$_REQUIRE, ...) {
  const foo = require(1);
  const leftpad = require(2);
  ...
},...");
```

The dependencies are traversed to build the dependency graph. Note that this also handles cyclic dependencies as this is accepted. Since transformation is a bit complex, this process is slow. To improve this, metro uses 3 different strategies:

- Caching system
  - Extensible
  - Layered architecture
  - Facebook uses an "Http Remove Cache" that is used by CI and initial builds
- Parallelization
  - Metro parallelizes across cpus.
  - Metro uses `jest-worker` to improve the transformation of files when there is no cache.
- Delta Bundler
  - Available during development
  - Improves reloads significantly
  - Send changes only to devices
    - Uses A (addition), M (modified), D (deleted) to manage pushing changes.

## The journey to a bundle

## Monitor files in a project

Dealing with large amounts of files can be slow. Meto uses `jest-haste-map` to provide a list of files and emitting changes. This tool uses watchman whenever possible or fallback to `fs.watch`.

## Transform files

To support syntax, metro uses `Babel` to achieve transformation of files to standard javascript. Instead of running this in a single "main process", it spawns a lot of child workers to aid in the transformation in parallel. The ratio is about 1 worker per core. The module that powers this is `jest-worker`.

## Store cache artifacts

Metro ships with an internal cache. It is located inside the main process. Every time you want to transform something, you go through `transform` and this has access to the internal cache. Search for  transformed files starts with this later (or possibly a central database) before ending the search with a `jest-worker` if not found.

## Build bundles

Metro produces bundles throough serializers. There are 2 that ships with metro i.e. plain serializer and source map serializer.

The plain serializer is just like any other bundler. It concatenates the modules. Entry point would almost always be index 0 since metro uses numerical references. Another bundler is the RAM bundle. It uses a binary file with 3 sections (magic number, table of contents and modules list/offset) and it helps to access modules in constant time. See [https://reactnative.dev/docs/ram-bundles-inline-requires](https://reactnative.dev/docs/ram-bundles-inline-requires). There is also the delta bundler

## Metro and React Native

Metro was built primarily to integrate with React Native. Here is a list of how metro is tied to React Native.

1. Metro is built to provide sub-second reload cycles. Hence, adding and and debugging UIs happens very quickly.
2. One core feature of metro is fast startup. Since bundling happens quicker, startup of the app on device/emulator is improved.
3. Resolution and transformation stages of Metro setup allows a single file with translated Javascript code that won't be understood.
4. Asset objects (eg. png files) are converted into objects that can be displayed by the image component.

Essentially, developer experienc for React Native is improved because of Metro.
