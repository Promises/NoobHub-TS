#!/bin/bash


echo starting Noobhub server...
node dist/server.js &
sleep 2

if [ `netstat -ltnup 2>/dev/null | grep 1337 | wc -l` == 1 ]
then
  echo running tests...
  node client/javascript-node-js/client.test.js
  EXT=$?
  echo killing Noobhub server...
  jobs -l | awk '{print $2}' | xargs kill -9
  exit $EXT
else
  echo Noobhub not started, tests didnt run
  exit 1
fi
