
.Phony: build
build:
	@echo "Building..."
	deno run -A ys.ts build -A -v
	@echo "Done."

.Phony: check-fmt
check-fmt:
	deno fmt --check

.Phony: fmt
fmt:
	deno fmt

.Phony: test
test:
	@echo "Testing..."
	deno task test
	@echo "Done."

.Phony: test-readme
test-readme:
	@echo "Testing README..."
	deno run -A ys.ts run README.ys.yml
	@echo "Done."



.Phony: t
t:
	@echo "Testing..."
	deno task test:compile
	@echo "Done."

.Phony: tt
tt:
	make test
# for quick run some tests
.Phony: r
r:
	@echo "Running..."
	deno run --allow-read --allow-write --allow-net ys.ts run README.ys.yml
	@echo "Done."
# for quick run some tests
.Phony: b
b:
	@echo "Running..."
	deno run --allow-read --allow-write --allow-net ys.ts build --runtime README.ys.yml
	@echo "Done."
# for quick run some tests
.Phony: d
d:
	@echo "Running..."
	deno run --allow-read --allow-write --allow-net dist/examples/full.js
	@echo "Done."

.Phony: readme
readme:
	@echo "Generating README.md..."
	deno run -A ys.ts run docs/make_readme.ys.yml
	@echo "Done."

.Phony: devreadme
devreadme:
	@echo "Generating README.md..."
	YAMLSCRIPT_DEV=1 deno run -A ys.ts build docs/make_readme.ys.yml
	@echo "Done."


.Phony: deno-deploy-hello-world
deno-deploy-hello-world:
	deno run -A ys.ts build docs/advanced/05_deno_deploy.ys.yml


.Phony: site
site:
	@echo "Generating site..."
	deno run -A ys.ts run docs/make_site.ys.yml
	@echo "Done."
.Phony: devsite
devsite:
	@echo "Generating site..."
	YAMLSCRIPT_DEV=1 deno run -A ys.ts run docs/make_site.ys.yml
	@echo "Done."
	
.Phony: buildsite
buildsite:
	@echo "Generating site..."
	deno run -A ys.ts build docs/make_site.ys.yml
	@echo "Done."