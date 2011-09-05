Redis Viewer
============
Simple browser-based admin for redis

Notes
-----
Since this is intended to be a development tool there are a few caveats:

* the default command is `KEYS *` which could cause performance issues if you have a lot of keys (I'm working on an alternative)

Pre-reqs
-------------
* express
* underscore
* socket.io
* node_redis + hiredis (required?)
* connect-redis
* coffee-script
* optimist
* less

`npm install underscore express socket.io redis hiredis connect-redis less coffee-script optimist`

Installation
------------
1. `git clone git://github.com/FreeFlow/redis-viewer.git`
2. `cd redis-viewer/`
3. `node server.js`