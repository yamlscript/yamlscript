# YAAS

YAML as a shell!

> Work in progress.

## Usage

Let's say we have `a.yml` with:

```yaml
#!/usr/bin/env yaas
- use: fetch-rss
  args:
      - https://actionsflow.github.io/test-page/hn-rss.xml
# open <https://requestbin.com/r/enyvb91j5zjv9/23eNPamD4DK4YK1rfEB1FAQOKIj> see
- loop: ${{last.result.items}}
  use: fetch
  args:
      - https://enyvb91j5zjv9.x.pipedream.net/
      - method: POST
        headers:
            Content-Type: application/json
        body: ${{JSON.stringify(ctx.item)}}
```

Run it:

```bash
yaas a.yml
```

Or, you can directly run it:

```bash
chmod +x a.yml
./a.yml
```

## run all shells

this will run all the shells in the current directory:

```bash
yaas -a
```

## run all yaml in some directory

```bash
yaas -d /path/to/dir
```

##
