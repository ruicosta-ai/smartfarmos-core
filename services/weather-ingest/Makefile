SHELL := /bin/bash

# Load env vars from .env when running targets
ENV := $(shell [ -f .env ] && cat .env | grep -v '^#' | xargs || true)

.PHONY: ingest verify last watch cron-example clean

## Run one ingestion cycle (uses .env)
ingest:
	@env $(ENV) ./wu_ingest.sh

## Show quick sanity: number of lines, last line ts, state ts
verify:
	@set -euo pipefail; \
	FILE=$$(ls -1 data/*$${WU_STATION:-IJUGUE1}.jsonl 2>/dev/null | tail -n1); \
	if [ -z "$$FILE" ]; then echo "no data file yet"; exit 0; fi; \
	LINES=$$(wc -l < "$$FILE" | tr -d ' '); \
	LAST_TS_LINE=$$(tail -n1 "$$FILE" | jq -r .ts); \
	STATE_TS=$$(cat data/state_$${WU_STATION:-IJUGUE1}.last 2>/dev/null || true); \
	echo "file: $$FILE"; \
	echo "lines: $$LINES"; \
	echo "last.ts (file): $$LAST_TS_LINE"; \
	echo "last_ts (state): $$STATE_TS";

## Show the last normalized observation line
last:
	@set -euo pipefail; \
	FILE=$$(ls -1 data/*$${WU_STATION:-IJUGUE1}.jsonl 2>/dev/null | tail -n1); \
	if [ -z "$$FILE" ]; then echo "no data file yet"; exit 0; fi; \
	tail -n1 "$$FILE" | jq .

## Follow the data file in real time (ctrl+c to stop)
watch:
	@set -euo pipefail; \
	FILE=$$(ls -1 data/*$${WU_STATION:-IJUGUE1}.jsonl 2>/dev/null | tail -n1); \
	if [ -z "$$FILE" ]; then echo "no data file yet"; exit 0; fi; \
	tail -f "$$FILE"

## Print a crontab example for 5-min schedule on the server
cron-example:
	@echo "*/5 * * * * cd $$(pwd) && env $$(cat .env | grep -v '^#' | xargs) ./wu_ingest.sh >> data/ingest.log 2>&1"

## Remove generated data files (careful)
clean:
	@rm -f data/*$${WU_STATION:-IJUGUE1}.jsonl data/state_$${WU_STATION:-IJUGUE1}.last || true
