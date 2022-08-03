# YAMLScript

We use [YAML syntax](https://yaml.org/) to define a set of tasks declaratively, YAMLScript will help you compile it into Javascript code that runs on Deno. Think about [Lisp](https://en.wikipedia.org/wiki/Lisp_(programming_language)), but in YAML.

> **Note**
> You need to know the basic syntax of YAML, javascript, and maybe a little [Deno](https://deno.land/manual), if you havn't, check out[Learn YAML in Y minutes](https://learnxinyminutes.com/docs/yaml/) and [Learn Javascript in Y minutes](https://learnxinyminutes.com/docs/javascript/), it's not hard!

> **Warning**
> This project is still in a very early stage, the api may consider changes.

## Table of Contents

- [Introduction](#introduction)
- [Simple Usage](#simple-usage)
- [Advanced Usage](#advanced-usage)
- [Installation](#installation)
- [CLI](#cli)
- [Links](#links)

## Introduction

YAMLScript is designed to solve the most common problems with minimal knowledge.
It can be considered as an alternative for
[dotfiles utilities](https://dotfiles.github.io/utilities/) such as
[chezmoi](https://www.chezmoi.io/), or an alternative to automated workflows
such as [Ansible](https://www.ansible.com/), it can also be a low-code
alternative to [IFTTT](https://ifttt.com/), [Zapier](https://zapier.com/),
[Pipedream](https://pipedream.com/), etc.


Run task file directly:

```bash
ys run task.ys.yml
```

Build task file and  deploy the compiled code to serverless services such as [Deno Deploy](https://deno.com/deploy):

```bash
ys build task.ys.yml && deployctl deploy --project=helloworld ./dist/task.js
```

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
  throw?: boolean;
}
```

And the compiled Javascript code is human readable, so if anything goes wrong,
we can easily locate and fix it. If you run into problems, go to the compiled
Javascript code, which is located in the `dist` directory by default.


## Simple Usage


### Basic

```yaml
# We use `def` to define a new variable
# `id` will be the variable name, `args` will be the value
- use: def
  id: obj
  args:
    list:
      - Hello
      - true
    foo:
      cat: 10

# We use javascript template string ${expression} for string interpolation
# You can use any valid js template expression here, even function.
# ${} can be escaped as \${} if needed
- use: console.log
  args:
    - ${obj.list[0]} World
    - ${obj.foo.cat}
    - ${JSON.stringify(obj.foo)}

```

This will be compiled to:

```javascript

// Task #0: obj
let obj = {
  "list": [
    `Hello`,
    true
  ],
  "foo": {
    "cat" : 10
  }
};

// Task #1
result = console.log(`${obj.list[0]} World`,`${obj.foo.cat}`,`${JSON.stringify(obj.foo)}`);

```


### Use

```yaml
# `use` is the operator name of the a task.
# We can use any Deno runtime function here
- use: fetch
  args: https://actionsflow.github.io/test-page/reddit-sample.json

# We also have some built-in functions, e.g., fetch rss feed entries

- use: rss.entries
  args: https://actionsflow.github.io/test-page/hn-rss.xml

# We also have a built-in lodash
# All built-in functions can be found here:
# https://github.com/yamlscript/yamlscript/blob/main/globals/mod.ts

# this will print: [2, 1]
- use: _.uniq
  args:
    - [2, 1, 2]

# use alias?

- from: https://deno.land/std@0.149.0/path/mod.ts
  use: extname as getExt
  args: test.js
- use: assertEquals
  args:
    - .js
    - $result

# use instance?

- use: new URL
  args: http://www.example.com/dogs
- use: assertEquals
  args:
    - www.example.com
    - $result.hostname

```

This will be compiled to:

```javascript
import { extname as getExt } from "https://deno.land/std@0.149.0/path/mod.ts";

// Task #0
result = await fetch(`https://actionsflow.github.io/test-page/reddit-sample.json`);

// Task #1
result = await rss.entries(`https://actionsflow.github.io/test-page/hn-rss.xml`);

// Task #2
result = _.uniq([
  2,
  1,
  2
]);

// Task #3
result = await getExt(`test.js`);

// Task #4
result = assertEquals(`.js`,result);

// Task #5
result = new URL(`http://www.example.com/dogs`);

// Task #6
result = assertEquals(`www.example.com`,result.hostname);

```


### Args

```yaml
# `args` can be array or other type
# if it's not an array, will be the first argument for the task
- use: rss.entries
  args: https://actionsflow.github.io/test-page/hn-rss.xml

# You can visit https://requestbin.com/r/enyvb91j5zjv9/23eNPamD4DK4YK1rfEB1FAQOKIj
# to check the http request.
- use: fetch
  args:
    - https://enyvb91j5zjv9.x.pipedream.net/
    - method: POST
      headers:
        Content-Type: application/json
      body: |
        {
          "title": "Hello world"
        }

```

This will be compiled to:

```javascript

// Task #0
result = await rss.entries(`https://actionsflow.github.io/test-page/hn-rss.xml`);

// Task #1
result = await fetch(`https://enyvb91j5zjv9.x.pipedream.net/`,{
  "method" : `POST`,
  "headers": {
    "Content-Type" : `application/json`
  },
  "body" : `{
  "title": "Hello world"
}
`
});

```


### Result

```yaml
- use: Math.max
  args: [1, 9, 5]

# We use `result` to indicate the return result of the previous task
# This will print "9"
- use: console.log
  args: ${result}

# How to print number 9?
# use `$expression`
# $expression can be escaped as \$expression if needed
- use: console.log
  args: $result

# We can also use `id` to define a identifier of the task
- id: max
  use: Math.max
  args: [1, 9, 5]

# then we can use the $id to represent the task result.
- use: console.log
  args:
    - $max

```

This will be compiled to:

```javascript

// Task #0
result = Math.max(1,9,5);

// Task #1
result = console.log(`${result}`);

// Task #2
result = console.log(result);

// Task #3: max
result = Math.max(1,9,5);
const max = result;

// Task #4
result = console.log(max);

```


### If

```yaml
# We can use `if` to control structures
# args is an built-in function, return the args
- use: def
  id: num
  args: 5

# You can use any js expression here, you may omit the expression syntax `$`
# Cause we evaluates the if conditional as an expression.
# this will print: yes, the args is greater than 4
- if: num > 4
  use: console.log
  args: yes, the args is greater than 4

- if: true
  use: console.log
  args: yes, it's true

```

This will be compiled to:

```javascript

// Task #0: num
let num = 5;

// Task #1
if (num > 4) {
  result = console.log(`yes, the args is greater than 4`);
}

// Task #2
result = console.log(`yes, it's true`);

```


### Loop

```yaml
# We use `loop` to define a loop, it can be an literal array
# You can access the item by using `item`
# the index by using `index`

# This will print "1. foo\n2. bar"
- loop:
    - foo
    - bar
  use: console.log
  args: ${index}. ${item}

- id: sources
  use: def
  args:
    - - 1
      - 2
# use $sources to get literals result

- id: loopResults
  loop: $sources
  use: _.multiply
  args:
    - $item
    - 2
# loopResults will be an array, every result of the loop will be pushed.

```

This will be compiled to:

```javascript

// Task #0
{
  const item = `foo`;
  index = 0;
  result = console.log(`${index}. ${item}`);
}
{
  const item = `bar`;
  index = 1;
  result = console.log(`${index}. ${item}`);
}
index = 0;

// Task #1: sources
let sources = [
  1,
  2
];

// Task #2: loopResults
let loopResults = [];
for await (const item of await sources){
  result = _.multiply(item,2);
  loopResults.push(result);
  index++;
}
index=0;

```


### Function

```yaml
# We also support define a function by using `defn`
# args[0] is the first argument, args[1] is the second argument.
- use: defn
  id: myFunction
  args:
    - use: _.upperCase
      args: $args[0]

# Then we can use this function
- use: myFunction
  args: abc

# assertEquals is a built-in function to do some tests
# which is from Deno std
# https://deno.land/std@0.149.0/testing#usage
- use: assertEquals
  args:
    - $result
    - ABC

```

This will be compiled to:

```javascript

// Task #0: myFunction
async function myFunction(...args){

  // Task #0_0
  result = _.upperCase(args[0]);

  return result;
}

// Task #1
result = await myFunction(`abc`);

// Task #2
result = assertEquals(result,`ABC`);

```


### Shell

```yaml
# We use colon plus cmd to run a command
- id: echo
  use: :echo Hello World

# Result will be:
# {
#   stdout: "Hello World\n",
#   stderr: "",
#   combined: "Hello World\n",
#   status: { success: true, code: 0 },
#   retries: 0
# }

- use: assertEquals
  args:
    - $echo.stdout
    - "Hello World\n"

```

This will be compiled to:

```javascript
import { __yamlscript_create_process } from "https://deno.land/x/yamlscript@0.0.3/globals/cmd/mod.ts";

// Task #0: echo
const __yamlscript_default_use_0 =  __yamlscript_create_process();
result = await __yamlscript_default_use_0`echo Hello World`;
const echo = result;

// Task #1
result = assertEquals(echo.stdout,`Hello World
`);

```


## Advanced Usage


### 1 Prevent Throw Error

```yaml
# Sometimes we want to ignore error, and let the tasks continue on error
# we use throw: false to prevent YAMLScript throw an error.
# when using throw: false, the result will be an object
# {
#  value: unknown
#  done: boolean
# }
# when task is failed, the value will be the error
# when task is success, the value will be the function result.
- use: JSON.parse
  args: "foo?bar"
  throw: false
  id: errorExample
- use: assertEquals
  args:
    - $errorExample.done
    - false
- use: assertEquals
  args:
    - $errorExample.value.message
    - Unexpected token 'o', "foo?bar" is not valid JSON

```

This will be compiled to:

```javascript

// Task #0: errorExample
let errorExample;
try {
  result = await JSON.parse(`foo?bar`);
  errorExample = result;
  result = {
    value: result,
    done: true
  };
  errorExample = result;
} catch (error) {
  result = {
    value: error,
    done: false
  };
  errorExample = result;
}

// Task #1
result = assertEquals(errorExample.done,false);

// Task #2
result = assertEquals(errorExample.value.message,`Unexpected token 'o', "foo?bar" is not valid JSON`);

```


### 2 New Instance

```yaml
# How to create class instance?
# just use new functioname
- use: new Date
  args: 2022-07-25
- use: assertEquals
  args:
    - "1658707200000"
    - ${result.getTime()}

```

This will be compiled to:

```javascript

// Task #0
result = new Date(`2022-07-25T00:00:00.000Z`
);

// Task #1
result = assertEquals(`1658707200000`,`${result.getTime()}`);

```


### Return

```yaml
# Use `return` to end the function
- use: defn
  id: myFunction
  args:
    - use: console.log
      args: foo
    - use: return
      if: true
    - use: console.log
      args: this will not be printed
- use: myFunction

```

This will be compiled to:

```javascript

// Task #0: myFunction
async function myFunction(...args){

  // Task #0_0
  result = console.log(`foo`);

  // Task #0_1
  return;

  // Task #0_2
  result = console.log(`this will not be printed`);

  return result;
}

// Task #1
result = await myFunction();

```


### Rss

```yaml
# fetch rss entries and notify some webhook
- id: entries
  use: rss.entries
  args: https://actionsflow.github.io/test-page/hn-rss.xml

# You can visit https://requestbin.com/r/enyvb91j5zjv9/23eNPamD4DK4YK1rfEB1FAQOKIj
# to check the http request.
- loop: $entries
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

```

This will be compiled to:

```javascript

// Task #0: entries
result = await rss.entries(`https://actionsflow.github.io/test-page/hn-rss.xml`);
const entries = result;

// Task #1
for await (const item of await entries){
  result = await fetch(`https://enyvb91j5zjv9.x.pipedream.net/`,{
    "method" : `POST`,
    "headers": {
      "Content-Type" : `application/json`
    },
    "body" : `{
  "title": "${item.title.value}",
  "link":  "${item.links[0].href}"
}
`
  });
  index++;
}
index=0;

```


### Cache

```yaml
# what if we want to deduplicate the rss items?
- id: entries
  use: rss.entries
  args: https://actionsflow.github.io/test-page/hn-rss.xml

- name: get cache
  id: kv
  use: fsExtra.readJSONFileWithDefaultValue
  args:
    - ./.yamlscript/cache/kv.json
    - ${}
- use: defn
  id: handleRssEntry
  args:
    - use: return
      if: kv[args[0].links[0].href]
    - name: notify
      use: fetch
      args:
        - https://enyvb91j5zjv9.x.pipedream.net/
        - method: POST
          headers:
            Content-Type: application/json
          body: |
            {
              "title": "${args[0].title.value}",
              "link":  "${args[0].links[0].href}"
            }
    - use: _.assign
      args:
        - $kv
        - $[args[0].links[0].href]: true

# You can visit https://requestbin.com/r/enyvb91j5zjv9/23eNPamD4DK4YK1rfEB1FAQOKIj
# to check the http request.
- loop: $entries
  use: handleRssEntry
  args: $item

- name: set to cache
  use: fsExtra.writeJSONFile
  args:
    - ./.yamlscript/cache/kv.json
    - $kv

```

This will be compiled to:

```javascript

// Task #0: entries
result = await rss.entries(`https://actionsflow.github.io/test-page/hn-rss.xml`);
const entries = result;

// Task #1: get cache
result = await fsExtra.readJSONFileWithDefaultValue(`./.yamlscript/cache/kv.json`,{});
const kv = result;

// Task #2: handleRssEntry
async function handleRssEntry(...args){

  // Task #2_0
  if (kv[args[0].links[0].href]) {
    return;
  }

  // Task #2_1  : notify
  result = await fetch(`https://enyvb91j5zjv9.x.pipedream.net/`,{
    "method" : `POST`,
    "headers": {
      "Content-Type" : `application/json`
    },
    "body" : `{
  "title": "${args[0].title.value}",
  "link":  "${args[0].links[0].href}"
}
`
  });

  // Task #2_2
  result = _.assign(kv,{
    [args[0].links[0].href] : true
  });

  return result;
}

// Task #3
for await (const item of await entries){
  result = await handleRssEntry(item);
  index++;
}
index=0;

// Task #4: set to cache
result = await fsExtra.writeJSONFile(`./.yamlscript/cache/kv.json`,kv);

```


### Define Global Variables

```yaml
# Sometimes we need to define a global var in child block
# We can use `defg` to define a global variable.
- use: Math.max
  args:
    - 1
    - 9

- if: result===9
  use: defg
  id: foo
  args: bar

- use: assertEquals
  args:
    - $foo
    - bar

```

This will be compiled to:

```javascript

// Task #0
result = Math.max(1,9);

// Task #1: foo
if (result===9) {
  foo = `bar`;
}

// Task #2
result = assertEquals(foo,`bar`);

```


### Deno Deploy

```yaml
- from: https://deno.land/std@0.149.0/http/server.ts
  use: serve
  args: $handler
  if: build.env.YS_SERVE == "1"

- use: defn
  id: handler
  args:
    - use: new Response
      args: Hello World

```

This will be compiled to:

```javascript

// Task #1: handler
async function handler(...args){

  // Task #1_0
  result = await new Response(`Hello World`);

  return result;
}

```


## Installation

1. Yamlscript depends on Deno, so you should install
   [Deno](https://deno.land/#installation) first.
2. Install YAMLScript by running

```bash
deno install -A https://deno.land/x/yamlscript/ys.ts
```


## CLI

```bash

  Usage:   ys
  Version: 0.0.1

  Description:

    yamlscript is written in yaml format and can be compiled into javscript that runs in deno.

  Options:

    -h, --help     - Show this help.
    -V, --version  - Show the version number for this program.
    -v, --verbose  - Enable verbose output.

  Commands:

    run    [file...]  - run files
    build  [file...]  - build yaml file to js file
```

```bash
# run some files
ys run a.ys.yml
ys run **/*.yml
ys run a.ys.yml b.ys.yml
# run all .ys.yml files
ys run -A
# run some directories
ys run -d a/b/c

# build is same as run
ys build a.ys.yml
```


## Notes

This README.md file is generated by the following YAMLScript.

```yaml
# get readme.template.md content
- id: readmeTemplate
  use: Deno.readTextFile
  args: ./docs/README.tmpl.md

# get yaml content
- id: yamlMakeReadmeScript
  use: Deno.readTextFile
  args: ./docs/make_readme.ys.yml

# get source content and target
- use: defn
  id: mapFiles
  args:
    - id: sourceContent
      use: Deno.readTextFile
      args: ${args[0]}
    - id: sourceTasks
      use: fsExtra.readYAMLFile
      args: ${args[0]}
    - id: targetCode
      use: YAMLScript.getCompiledCode
      args:
        - $sourceTasks
    - id: title
      from: https://deno.land/x/case@2.1.1/mod.ts
      use: titleCase
      args: ${args[2].slice(3,-7)}
    - use: return
      args:
        title: $title
        source: $sourceContent
        target: ${targetCode.topLevelCode}${targetCode.mainFunctionBodyCode}

# get simple usage sources and targets
- id: simpleUsageFiles
  use: Deno.readDirSync
  args: ./docs/simple-usage

- loop: $simpleUsageFiles
  id: simpleUsageFileNames
  use: _.get
  args:
    - $item
    - name
# sort
- id: sortedSimpleUsageFiles
  use: _.sortBy
  args:
    - $simpleUsageFileNames

- id: simpleUsageSources
  loop: $sortedSimpleUsageFiles
  use: mapFiles
  args:
    - ./docs/simple-usage/${item}
    - $index
    - $item
# get advanced usage sources and targets
- id: advancedFiles
  use: Deno.readDir
  args: ./docs/advanced

- loop: $advancedFiles
  id: advancedFileNames
  use: _.get
  args:
    - $item
    - name
# sort
- id: sortedAdvancedFiles
  use: _.sortBy
  args:
    - $advancedFileNames

- id: advancedSources
  loop: $sortedAdvancedFiles
  use: mapFiles
  args:
    - ./docs/advanced/${item}
    - $index
    - $item
# use mustache to render readme.template.md
- id: readmeContent
  from: https://esm.sh/mustache@4.2.0
  use: default.render
  args:
    - $readmeTemplate
    - simpleUsageSources: $simpleUsageSources
      advancedSources: $advancedSources
      yamlMakeReadmeScript: $yamlMakeReadmeScript

# readme content to generate toc

# write to readme.md
- use: Deno.writeTextFile
  args:
    - README.md
    - $readmeContent

```

See all [built-in functions](/globals/mod.ts)

Inspired by [Common Lisp](https://common-lisp.net/),
[Clojure](https://clojure.org/),
[Denoflow](https://github.com/denoflow/denoflow),
[Rash](https://github.com/rash-sh/rash),
[Comtrya](https://github.com/comtrya/comtrya)


## Links

- [Github Repo](https://github.com/yamlscript/yamlscript)
- [Deno land Module](deno.land/x/yamlscript)
- [Official Site](https://yamlscript.deno.dev)