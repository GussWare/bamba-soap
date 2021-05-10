/*
 * Copyright (c) 2011 Vinay Pulim <vinay@milewise.com>
 * MIT Licensed
 */

"use strict";

var Client = require("./client").Client,
	Server = require("./server").Server,
	HttpClient = require("./http"),
	security = require("./security"),
	passwordDigest = require("./utils").passwordDigest,
	BluebirdPromise = require("bluebird"),
	wsdl = require("./wsdl"),
	WSDL = require("./wsdl").WSDL;

function createCache() {
	var cache = {};
	return function (key, load, callback) {
		if (!cache[key]) {
			load(function (err, result) {
				if (err) {
					return callback(err);
				}
				cache[key] = result;
				callback(null, result);
			});
		} else {
			process.nextTick(function () {
				callback(null, cache[key]);
			});
		}
	};
}
var getFromCache = createCache();

function _requestWSDL(url, options, callback) {
	if (typeof options === "function") {
		callback = options;
		options = {};
	}

	console.log(" ");
	console.log(" url", url);
	var openWsdl = wsdl.open_wsdl.bind(null, url, options);

	console.log("openWsdl", JSON.stringify(url));

	if (options.disableCache === true) {
		console.log(" entra en open wsdl ");
		openWsdl(callback);
	} else {
		console.log(" entra en open cache openwsdl ");
		getFromCache(url, openWsdl, callback);
	}
}

function createClient(url, options, callback, endpoint) {
	console.log(" ");
	console.log(" INICIA CREATE CLIENT ");
	console.log("url", url);
	console.log("options", JSON.stringify(options));

	if (typeof options === "function") {
		endpoint = callback;
		callback = options;
		options = {};
	}
	endpoint = options.endpoint || endpoint;
	_requestWSDL(url, options, function (err, wsdl) {
		callback(err, wsdl && new Client(wsdl, endpoint, options));
	});
	console.log(" FIN CREATE CLIENT ");
	console.log(" ");
}

function createClientAsync(url, options, endpoint) {
	if (typeof options === "undefined") {
		options = {};
	}
	return new BluebirdPromise(function (resolve, reject) {
		createClient(
			url,
			options,
			function (err, client) {
				if (err) {
					reject(err);
				}
				resolve(client);
			},
			endpoint
		);
	});
}

function listen(server, pathOrOptions, services, xml) {
	var options = {},
		path = pathOrOptions,
		uri = "";

	if (typeof pathOrOptions === "object") {
		options = pathOrOptions;
		path = options.path;
		services = options.services;
		xml = options.xml;
		uri = options.uri;
	}

	var wsdl = new WSDL(xml || services, uri, options);
	return new Server(server, path, services, wsdl, options);
}

exports.security = security;
exports.BasicAuthSecurity = security.BasicAuthSecurity;
exports.NTLMSecurity = security.NTLMSecurity;
exports.WSSecurity = security.WSSecurity;
exports.WSSecurityCert = security.WSSecurityCert;
exports.ClientSSLSecurity = security.ClientSSLSecurity;
exports.ClientSSLSecurityPFX = security.ClientSSLSecurityPFX;
exports.BearerSecurity = security.BearerSecurity;
exports.createClient = createClient;
exports.createClientAsync = createClientAsync;
exports.passwordDigest = passwordDigest;
exports.listen = listen;
exports.WSDL = WSDL;

// Export Client and Server to allow customization
exports.Server = Server;
exports.Client = Client;
exports.HttpClient = HttpClient;
