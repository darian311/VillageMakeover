#!/bin/bash
./compile.sh

if [ "$APPCFG" = "" ]; then
    if which appcfg.py; then
        APPCFG=appcfg.py
    else
        APPCFG=/Users/darianhickman/google-cloud-sdk/bin/appcfg.py
    fi
fi

./synclibs.sh
$APPCFG update --application=villagethegame111 --no_cookies --oauth2 . 2>&1 | grep -v 'Cannot upload both <filename>\.py and <filename>\.pyc' | grep -v 'Could not guess mimetype for'
