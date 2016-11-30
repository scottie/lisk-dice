"use strict";

var log 		= require ('./log');
var https		= require ('https');


/** WATERFALL */
var nextTick = function (fn) {
    if (typeof setImmediate === 'function') {
      setImmediate(fn);
    } else if (typeof process !== 'undefined' && process.nextTick) {
      process.nextTick(fn);
    } else {
      setTimeout(fn, 0);
    }
};

var makeIterator = function (tasks) {
    var makeCallback = function (index) {
      var fn = function () {
        if (tasks.length) {
          tasks[index].apply(null, arguments);
        }
        return fn.next();
      };
      fn.next = function () {
        return (index < tasks.length - 1) ? makeCallback(index + 1): null;
      };
      return fn;
    };
    return makeCallback(0);
};

var _isArray = Array.isArray || function(maybeArray){
    return Object.prototype.toString.call(maybeArray) === '[object Array]';
};

exports.waterfall = function (tasks, callback) {
	callback = callback || function () {};

	if (!_isArray(tasks)) { return callback (); }
	if (!tasks.length) { return callback (); }

	var wrapIterator = function (iterator) {
		return function (err) {
			var args = Array.prototype.slice.call(arguments);
			var next = iterator.next();

			if (next) {
				args.push (wrapIterator (next));
			} else {
				args.push (callback);
			}

			nextTick(function () {
				iterator.apply(null, args);
			});
		};
	};

    wrapIterator(makeIterator(tasks))();
};



exports.postRaw = function (host /*: string*/, path /*: string*/, post_data, cb, notsec /*: boolean*/) {
	var proto = https;
	if (notsec !== undefined && notsec)
		proto = http;

	var options = {
		host: host,
		path: path,
		method: 'POST',
		json: true,
		body: post_data,
      	headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(post_data)
      	}
	}

	var callback = function (response) {
		var str = '';
		response.on('data', function (chunk) { str += chunk; });
		response.on('end', function () {
			try {
				var data = JSON.parse (str);
				cb (null, data);
			} catch (e) { cb (true, null); }
		});
	}

	var req = proto.request(options, callback);
	req.write (post_data);
	req.on('error', function(e) { cb (e, null); });
	req.end();
};




exports.mailCheck = function (email /*: string*/) {
	var mail_re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
	return mail_re.test (email);
};

