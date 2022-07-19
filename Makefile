.Phony: run
run:
	@echo "Running..."
	deno run --allow-read --allow-write --allow-net cli.ts run examples/rss-notify.yml
	@echo "Done."