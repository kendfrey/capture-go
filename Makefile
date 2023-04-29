PATH := node_modules/.bin:$(PATH)

.PHONY: ts clean

all: ts html

ts:
	tsc
	esbuild ./js/index.js --bundle --sourcemap --sources-content=false --outfile=./docs/index.js

html:
	n-copy --source src --destination docs **/*.html **/*.css

clean:
	n-clean js
	n-clean docs