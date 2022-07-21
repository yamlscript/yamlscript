
.Phony: build
build:
	@echo "Building..."
	deno run --allow-read --allow-write --allow-net cli.ts build examples/rss-notify.yml -v
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
	deno run --allow-read --allow-write --allow-net cli.ts run README.ys.yml
	@echo "Done."
# for quick run some tests
.Phony: b
b:
	@echo "Running..."
	deno run --allow-read --allow-write --allow-net cli.ts build --runtime README.ys.yml
	@echo "Done."
# for quick run some tests
.Phony: d
d:
	@echo "Running..."
	deno run --allow-read --allow-write --allow-net dist/examples/full.js
	@echo "Done."
