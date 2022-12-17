#!/bin/bash
if [ "$1" = "-d" ]; then
    # decode base64
    res=$(echo -n "$2" | base64 -d)
else
    # encode base64
    res=$(echo -n "$1" | base64)
fi
printf "%s" "$res"

