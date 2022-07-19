.Phony: run
run:
	@echo "Running..."
	deno run --allow-read --allow-write --allow-net cli.ts run examples/rss-notify.yml
	@echo "Done."

.Phony: build
build:
	@echo "Building..."
	deno run --allow-read --allow-write --allow-net cli.ts build examples/rss-notify.yml -v
	@echo "Done."