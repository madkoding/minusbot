import sys
import json

args = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {}
name = args.get("name", "World")
print(f"Hello, {name}! This is running inside Docker.")
