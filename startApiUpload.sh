ps -ef | grep 'uploadServer.js' | grep -v grep | awk '{print $2}' | xargs kill -9 1> killLog.out 2> killErr.out
cd ./build cd ./build
node uploadServer.js 1> logUpload.out 2> errUpload.out &