#!/bin/sh
# $1: JSON payload
JSON=$1

# Extract simple values
HOST=$(echo "$JSON" | sed -n 's/.*"host":"\([^"]*\)".*/\1/p')
USER=$(echo "$JSON" | sed -n 's/.*"user":"\([^"]*\)".*/\1/p')
PORT=$(echo "$JSON" | sed -n 's/.*"port":\([0-9]*\).*/\1/p')
[ -z "$PORT" ] && PORT=22

IGNORE_FAIL=$(echo "$JSON" | sed -n 's/.*"ignoreFail":\([^,}]*\).*/\1/p' | tr -d ' ')

# Helper to extract array elements safely
# This is a bit tricky in pure sh, but we'll try to split by "," and clean up
extract_array() {
    key=$1
    echo "$JSON" | sed -n 's/.*"'$key'":\[\([^]]*\)\].*/\1/p' | sed 's/","/\n/g' | sed 's/^"//;s/"$//'
}

COMMANDS=$(extract_array "commands")
CLEANUP=$(extract_array "cleanup_commands")

# Execute primary commands
echo "$COMMANDS" > /tmp/cmds
exit_code=0
while IFS= read -r cmd; do
    if [ -n "$cmd" ]; then
        echo "--- Executing: $cmd ---"
        ssh -o StrictHostKeyChecking=no -p "$PORT" "$USER@$HOST" "$cmd"
        curr_exit=$?
        if [ $curr_exit -ne 0 ]; then
            echo "Error: Command returned $curr_exit"
            exit_code=$curr_exit
            if [ "$IGNORE_FAIL" != "true" ]; then
                echo "Stopping execution due to failure."
                break
            fi
        fi
    fi
done < /tmp/cmds

# Execute cleanup commands
if [ -n "$CLEANUP" ]; then
    echo "--- Running Cleanup ---"
    echo "$CLEANUP" > /tmp/cleanup
    while IFS= read -r cmd; do
        if [ -n "$cmd" ]; then
            ssh -o StrictHostKeyChecking=no -p "$PORT" "$USER@$HOST" "$cmd"
        fi
    done < /tmp/cleanup
fi

exit $exit_code
