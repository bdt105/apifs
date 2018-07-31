ps -ef | grep 'apiServer.js' | grep -v grep | awk '{print $2}' | xargs kill -9 1> killLog.out 2> killErr.out
cd ./build
node apiServer.js 1> logFs.out 2> errFs.out &