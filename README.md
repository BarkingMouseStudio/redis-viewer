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

Features
--------
* view redis store keys and values - string, key, list, set, zset and hash currently supported
* delete individual keys and values on all data structures
* execute arbitrary commands
* formats JSON values in keys
* command line options for ip, port and password (optional; for AUTH)
* full keyboard arrow navigation and 'x' to delete, enter to expand

TODO
----
* add second MONITOR client and push changes to the clients current data view using websockets
* hierarchical key organization for better performance with many keys
* status responses should slide down
* confirmation messages should slide down with enter/esc keyboard shortcuts
* npm package to make installation/maintenance easier
* editing keys/values
