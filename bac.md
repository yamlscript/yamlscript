# YAML Script

YAML script!

> Work in progress.

## Usage

Let's say we have `a.ys.yml` with:

```yaml
- use: Math.max
  args:
    - 1
    - 5
    - 3
- use: console.log
  args:
    - The max value is ${result}
```

Run it:

```bash
ysh a.ys.yml
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
    - /tmp/ys-test
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

### cache key

```yaml
- id: rssItems
  use: rss.entries
- id: _onEntry
  tasks:
    - use: continue
      if: "isInCache(_0.id)"
    - use: fetch
      args: 
        - https://xxxxxx.com
        - {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          body: ${JSON.stringify({
            id: item.id
          })}
        }
- loop: ${$0.result}
  use: _onEntry
  args:
    - $item
- loop: ${$0.result}
  use: setUnique
  args: $result.id
```

### fn

```yaml
- use:
```
