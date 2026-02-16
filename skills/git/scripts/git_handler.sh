#!/bin/sh

# Inputs are passed as a JSON string in the first argument
INPUTS=$1

# Helper to extract value from JSON using simple grep/sed (since we might not have jq)
get_json_val() {
    key=$1
    echo "$INPUTS" | sed -n 's/.*"'$key'":"\([^"]*\)".*/\1/p'
}

get_json_bool() {
    key=$1
    echo "$INPUTS" | sed -n 's/.*"'$key'":\([^,}]*\).*/\1/p'
}

ACTION=$(get_json_val "_action")

# Setup Git Identity
NAME=${CONFIG_user_name}
EMAIL=${CONFIG_user_email}

if [ -n "$NAME" ]; then
    git config --global user.name "$NAME"
fi

if [ -n "$EMAIL" ]; then
    git config --global user.email "$EMAIL"
fi

# Authenticated URL Helper
TOKEN=${PERSONAL_TOKEN}
get_auth_url() {
    url=$1
    if [ -n "$TOKEN" ] && ! echo "$url" | grep -q "@"; then
        echo "$url" | sed "s|https://|https://${TOKEN}@|"
    else
        echo "$url"
    fi
}

case "$ACTION" in
    "clone")
        URL=$(get_json_val "url")
        DIR=$(get_json_val "directory")
        AUTH_URL=$(get_auth_url "$URL")
        if [ -n "$DIR" ]; then
            git clone "$AUTH_URL" "$DIR"
        else
            git clone "$AUTH_URL"
        fi
        ;;
    "commit")
        MSG=$(get_json_val "message")
        ALL=$(get_json_bool "all")
        if [ "$ALL" = "true" ]; then
            git add -A
        fi
        git commit -m "$MSG"
        ;;
    "push")
        REMOTE=$(get_json_val "remote")
        BRANCH=$(get_json_val "branch")
        git push "${REMOTE:-origin}" "${BRANCH:-main}"
        ;;
    "pull")
        REMOTE=$(get_json_val "remote")
        BRANCH=$(get_json_val "branch")
        git pull "${REMOTE:-origin}" "${BRANCH:-main}"
        ;;
    "add")
        PATH_VAL=$(get_json_val "path")
        git add "${PATH_VAL:-.}"
        ;;
    "status")
        git status
        ;;
    "raw")
        ARGS=$(get_json_val "args")
        # Careful with space splitting here
        git $ARGS
        ;;
    *)
        echo "Unknown action: $ACTION"
        ;;
esac
