# Apache Flagon Website (`site/`)

This directory contains the Jekyll source for the official [Apache Flagon website](https://flagon.apache.org).

---

## Option 1: Build and Serve with Docker (Recommended)

1. Build the container image:
   ```bash
   docker build -t flagon:site .
   ```
2. Serve the site on `http://localhost:8000`:
   ```bash
   docker run --rm -p 8000:8000 flagon:site
   ```

---

## Option 2: Local Ruby / Bundler Build

Requires Ruby `>= 3.1` and Bundler:

```bash
bundle install
bundle exec jekyll serve --port 8000
```

To build the static site output into `_site/`:

```bash
./build.sh
```

---

## Updating the Interactive UserALE.js Live Demo Bundle

The interactive live demo (`_includes/useralejsDemo.html`) uses the UserALE 2.5 browser IIFE bundle at `js/userale-demo.min.js`. To refresh it from the local monorepo source:

```bash
cd ../products/userale
pnpm install
pnpm --dir packages/flagon-userale build
cp packages/flagon-userale/build/main.global.js ../../site/js/userale-demo.min.js
```
