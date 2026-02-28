#!/bin/bash
export PATH="/opt/homebrew/bin:$PATH"
cd /Users/patkidwell/Projects/e-reader
exec node node_modules/.bin/next dev --webpack
