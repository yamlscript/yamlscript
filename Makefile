.Phony: run
run:
	@echo "Running..."
	deno run --allow-read --allow-write --allow-env="NODE_DEBUG" cli.ts run examples/rss-notify.yml --debug
	@echo "Done."