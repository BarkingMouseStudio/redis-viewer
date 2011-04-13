Redis Viewer
============
A simple admin interface for redis.

----------

Notes
-----
I'm just using this as a development tool so there are a few caveats:

* the default command is `KEYS *` which could cause performance issues if you have a lot of keys
* there is no authentication so don't run it on a public server unless you're really really sure

----------

Pre-reqs
-------------
* socket.io
* express
* node_redis + hiredis (required?)
* underscore
* connect-redis

`npm install underscore express socket.io redis hiredis connect-redis`

----------

Installation
------------
1. `git clone git://github.com/ikarosdaedalos/redis-viewer.git`
2. `cd redis-viewer/`
3. `node server.js # redis-server must be running on localhost:[default port]`

----------

Features
--------
* view redis store keys and values - string, key, list and hash currently supported
* delete individual keys
* execute arbitrary commands
* formats JSON values

----------

TODO
----
* distinguish between integer and bulk responses
* include scores within the zset items, not as separate items
