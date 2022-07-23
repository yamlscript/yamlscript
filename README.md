# YAMLScript

We use YAML syntax to define a set of tasks declaratively, YAMLScript will help
you compile it into Javascript code that runs on Deno.

We can use YAMLScript to run task files directly:

```bash
ys run task.ys.yml
```

Or we can also deploy the compiled Javascript files to serverless services such
as [Deno Deploy](https://deno.com/deploy):

```bash
ys build task.ys.yml && deployctl deploy --project=helloworld ./dist/task.js
```

YAMLScript is designed to solve the most common problems with minimal knowledge.
It can be considered as an alternative for
[dotfiles utilities](https://dotfiles.github.io/utilities/) such as
[chezmoi](https://www.chezmoi.io/), or an alternative to automated workflows
such as [Ansible](https://www.ansible.com/), it can also be a low-code
alternative to [IFTTT](https://ifttt.com/), [Zapier](https://zapier.com/),
[Pipedream](https://pipedream.com/), etc.

In YAMLScript, The following interface is the only property we need to
understand, they are all optional.

```typescript
interface Task {
  id?: string;
  name?: string;
  from?: string;
  use?: string;
  args?: unknown | unknown[];
  loop?: string | number | unknown[];
  if?: boolean | string;
  catch?: boolean;
}
```

And the compiled Javascript code is human readable, so if anything goes wrong,
we can easily locate and fix it. If you run into problems, go to the compiled
Javascript code, which is located in the `dist` directory by default.

> This project is still in development, most things are already working.


```yaml
# Print something As you see, we use `loop` to define a loop, it can be an literal array, like above, you can access the item by using \${item}, the index by using \${index}, just like javascript template strings. You will use `use` to call a function, it can be any global function from deno. We also have some YAMLScript built-in functions, for example, we have `rss.entries` function, which can help you to get the fedd entries.(you can see all built-in function here https://github.com/YAMLScript/YAMLScript/blob/main/globals/mod.ts )
- use: console.log
  args:
    - Hello
    - World

- name: test

- name: YAML Script Introduction
  loop:
    - I'm so excited to explain 'YAMLScript' with 'YAMLScript'!
    - What is it?
    - YAMLScript is written in yaml format and can be compiled into javscript that runs in deno.
    - What can it do?
    - We can use it to manage our dotfiles, workflows like send feed entries to chat room,
      or we can even choose to deploy it to a serverless server such as deno deploy.
  use: console.log
  args: ${index}. ${item}

- name: Fetch RSS Entries
  desc:
    As you see, we use `loop` to define a loop, it can be an literal array, like above, you can access the item by using \${item}, the index by using \${index}, just like javascript template strings. You will use `use` to call a function, it can be any global function from deno. We also have some YAMLScript built-in functions, for example, we have `rss.entries` function, which can help you to get the fedd entries.
    (you can see all built-in function here https://github.com/YAMLScript/YAMLScript/blob/main/globals/mod.ts )
  use: rss.entries
  args: https://actionsflow.github.io/test-page/hn-rss.xml

- name: Literal Variable
  desc: '`result` variable will be the last task returned result,
    please note\: `$result` is a variable, but `\${result}` is a string.
    `rss.entries` function will return an array, so we can loop the array like the following.
    You can visit https://requestbin.com/r/enyvb91j5zjv9/23eNPamD4DK4YK1rfEB1FAQOKIj
    to check the request'
  loop: $result
  use: fetch
  args:
    - https://enyvb91j5zjv9.x.pipedream.net/
    - method: POST
      headers:
        Content-Type: application/json
      body: |
        {
          "title": "${item.title.value}",
          "link":  "${item.links[0].href}"
        }

- name: test
  desc:
    How to run this yaml file? Cause YAMLScript depended Deno, so we should install
    https://deno.land/#installation first, as you see, we can run a command line tool
    that begins with a colon `:`, then YAMLScript will consider it as a cmd call.
    You also noticed that I use `if` with `false` to prevent this task.
  use: :brew install deno
  if: false
- name: Once deno installed in your local enviroment, you can install YAMLScript now.
  use: :deno install -A https://deno.land/x/YAMLScript/ys.ts
  if: false
- name: Now you can run this file
  use: :ys run https://raw.githubusercontent.com/YAMLScript/YAMLScript/main/README.ys.yml
  if: false
- name:
    You can also see the compiled javascript code , the built file will placed
    in `dist` folder, you can submit this folder to git, if you want to run the code
    with serverless service like deno deploy.
  use: :ys build https://raw.githubusercontent.com/YAMLScript/YAMLScript/main/README.ys.yml
  if: false

- name:
    You have seen we use `if` before, actually, we can use any condition here,
    you should't add $, or \${} in if condition.
  if: Date.now() > 0
  use: setGlobalVars
  args:
    nowIsGreaterThanZero: true
- name:
    We can use assertEquals to test our code, once it failed, it'll throw an error.
    `assertEquals` is a built-in function, you can use it directly.
  use: assertEquals
  args:
    - $nowIsGreaterThanZero
    - true

```

## Install

1. Yamlscript depends on Deno, so you should install
   [Deno](https://deno.land/#installation) first.
2. Install YAMLScript by running
   `deno install -A https://deno.land/x/YAMLScript/ys.ts`.

## Notes

This README.md file is generated by the following YAMLScript.

```yaml
- id: readmeYAMLContent
  use: readTextFile
  args: ./README.ys.yml
- id: readmeTemplate
  use: readTextFile
  args: ./README.template.md
- id: yamlMakeReadmeScript
  use: readTextFile
  args: ./scripts/make_readme.ys.yml
- id: readmeContent
  from: https://esm.sh/mustache@4.2.0
  use: default.render
  args:
    - $readmeTemplate
    - readmeYAMLContent: $readmeYAMLContent
      yamlMakeReadmeScript: $yamlMakeReadmeScript
- use: writeTextFile
  args:
    - README.md
    - $readmeContent

```

See all [built-in functions](/globals/mod.ts)
