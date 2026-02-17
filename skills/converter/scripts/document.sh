#!/bin/sh
# $1 contains the JSON string
JSON=$1

# Very basic JSON parsing using sed
INPUT=$(echo "$JSON" | sed -n 's/.*"input":"\([^"]*\)".*/\1/p')
OUTPUT=$(echo "$JSON" | sed -n 's/.*"output":"\([^"]*\)".*/\1/p')
OPTIONS=$(echo "$JSON" | sed -n 's/.*"options":"\([^"]*\)".*/\1/p')

# Execute pandoc
pandoc "$INPUT" $OPTIONS -o "$OUTPUT"
