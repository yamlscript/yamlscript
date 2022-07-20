# Ysh

YAML shell!

> Work in progress.

## Usage

Let's say we have `a.ysh.yml` with:

```yaml
#!/usr/bin/env ysh
- use: rss.entries
  args:
    - https://actionsflow.github.io/test-page/hn-rss.xml
# open <https://requestbin.com/r/enyvb91j5zjv9/23eNPamD4DK4YK1rfEB1FAQOKIj> see
- loop: $result
  use: fetch
  args:
    - https://enyvb91j5zjv9.x.pipedream.net/
    - method: POST
      headers:
        Content-Type: application/json
      body: ${{JSON.stringify(item)}}
```

Run it:

```bash
ysh a.ysh.yml
```

Or, you can directly run it:

```bash
chmod +x a.ysh.yml
./a.yml
```

## run all shells

this will run all the shells in the current directory:

```bash
ysh -a
```

## run all yaml in some directory

```bash
ysh -d /path/to/dir
```

## In favor of Unix?

```yaml
- use: :mkdir
  args: -p /tmp/ysh-test
```

## Keywords

### `from`

### `use`

for built-in:

```yaml
- use: rss.entries
```

lodash also is built in:

```yaml
- use: _.get
  args:
    - foo:
        key: bar
    - foo.key
- use: assertEqual
  args:
    - $result
    - bar
```

for third-party modules:

```yaml
- from: https://deno.land/std@0.148.0/path/mod.ts
  use: extname
  args: "test.js"
```

for cmd:

```yaml
- use: :mkdir
  args:
    - -p
    - /tmp/ysh-test
```

### `args`

### `loop`

### `if`

### `id`

```yaml
- id: test
```

```yaml
# this will define a function, will not be called
- id: _test
```

### assert

Simple:

```yaml
- use: asserts.assert
  args:
    - "{{result.foo}}"
    - "bar"
```

```yaml
```

And:

```yaml
assert:
  - ${result}==true
  - ${result}==fals
```

Or:

```yaml
assertOr:
  - ${result}==true
  - ${result}==fals
```

### `fn`

```yaml
- id: _onFetch
  from: ./rss-notify.ysh.yml
- use: addEventListener
  args:
    - fetch
    - _onFetch
```

### `tasks`
