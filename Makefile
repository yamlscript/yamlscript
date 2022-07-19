.Phony: run
run:
	@echo "Running..."
	deno run --allow-read --allow-env="NODE_DEBUG" cli.ts examples/rss-notify.yml --build-deno-deploy
	@echo "Done."