#!/bin/sh
# $1 contains the JSON string
JSON=$1

# Extract output path
OUTPUT=$(echo "$JSON" | sed -n 's/.*"output":"\([^"]*\)".*/\1/p')

# Extract images array and convert to space-separated list
# Example input: {"images":["1.png","2.png"],"output":"out.pdf"}
IMAGES=$(echo "$JSON" | sed -n 's/.*"images":\[\([^]]*\)\].*/\1/p' | tr -d '"' | tr ',' ' ')

# Execute magick to combine images into PDF
magick $IMAGES "$OUTPUT"
