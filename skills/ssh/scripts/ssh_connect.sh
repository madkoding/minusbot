#!/bin/sh
# $1: JSON payload
JSON=$1

# Extract values
HOST=$(echo "$JSON" | sed -n 's/.*"host":"\([^"]*\)".*/\1/p')
USER=$(echo "$JSON" | sed -n 's/.*"user":"\([^"]*\)".*/\1/p')
PORT=$(echo "$JSON" | sed -n 's/.*"port":\([0-9]*\).*/\1/p')
[ -z "$PORT" ] && PORT=22

# Establish SSH bridge
# StrictHostKeyChecking=no to avoid prompt for unknown hosts
# -o BatchMode=no to allow password prompt if needed (though usually it's public keys)
# Actually, kroniak/ssh-client might not have a full TTY allocated by default depending on how it's called
# but for a bridge stdin <-> stdout it's fine.
exec ssh -o StrictHostKeyChecking=no -t -p "$PORT" "$USER@$HOST"
