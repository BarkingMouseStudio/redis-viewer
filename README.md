Redis Viewer
============
Simple browser-based admin for redis

Notes
-----
I'm just using this as a development tool so there are a few caveats:

* the default command is `KEYS *` which could cause performance issues if you have a lot of keys
* there is no authentication yet so don't run it on a public server unless you're really really sure

Pre-reqs
-------------
* socket.io
* express
* node_redis + hiredis (required?)
* underscore
* connect-redis

`npm install underscore express socket.io redis hiredis connect-redis`

Installation
------------
1. `git clone git://github.com/ikarosdaedalos/redis-viewer.git`
2. `cd redis-viewer/`
3. `node server.js`

Features
--------
* view redis store keys and values - string, key, list, set, zset and hash currently supported
* delete individual keys and values
* execute arbitrary commands
* formats JSON values (useful for express sessions)

TODO
----
* add command options (ip:port)
* add authentication support
