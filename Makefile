.Phony: run
run:
	@echo "Running..."
	deno run --allow-read --allow-write --allow-env="NODE_DEBUG" cli.ts examples/rss-notify.yml --debug --build-deno-deploy
	@echo "Done."