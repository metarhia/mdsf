'use strict';

api.jstp = {};

// Deserialize string to object
//   jsrs - JSRS string
//   return - deserialized JavaScript object
//
api.jstp.parse = function(jsrs) {
  var sandbox = api.vm.createContext({});
  var js = api.vm.createScript('(' + jsrs + ')');
  var exported = js.runInNewContext(sandbox);
  for (var key in exported) {
    sandbox[key] = exported[key];
  }
  return exported;
};

// Serialize object to string
//   obj - JavaScript object to be serialized
//   return - JSRS string
//
api.jstp.stringify = function(obj, i, arr) {
  var type;
  if (obj instanceof Array) type = 'array';
  else if (obj instanceof Date) type = 'date';
  else if (obj === null) type = 'undefined';
  else type = typeof(obj);
  var fn = api.jstp.stringify.types[type];
  return fn(obj, arr);
};

api.jstp.stringify.types = {
  number: function(n) { return n + ''; },
  string: function(s) { return '\'' + s + '\''; },
  boolean: function(b) { return b ? 'true' : 'false'; },
  //null: function() { return 'null'; },
  undefined: function(u, arr) { return !!arr ? '' : 'undefined'; },
  function: function() { return 'undefined'; },
  date: function(d) {
    return '\'' + d.toISOString().split('T')[0] + '\'';
  },
  array: function(a) {
    return '[' + a.map(api.jstp.stringify).join(',') + ']';
  },
  object: function(obj) {
    var a = [], s;
    for (var key in obj) {
      s = api.jstp.stringify(obj[key]);
      if (s !== 'undefined') {
        a.push(key + ':' + s);
      }
    }
    return '{' + a.join(',') + '}';
  }
};

// Convert data into object using metadata
//   data - deserialized JSRD object
//   metadata - JSRM object
//   return - JavaScript object
//
api.jstp.dataToObject = function(data, metadata) {
  
};

// Convert object into data using metadata
//   obj - JavaScript object
//   metadata - JSRM object
//   return - JSRD object
//
api.jstp.objectToData = function(obj, metadata) {
  
};

// Mixin JSRD methods and metadata to data
//   data - data array
//   metadata - JSRM object
//   return - JSRD object
//
api.jstp.jsrd = function(data, metadata) {
  var obj = {},
      keys = Object.keys(metadata);
  keys.forEach(function(fieldName, index) {
    Object.defineProperty(obj, fieldName, {
      enumerable: true,
      get: function () {
        return data[index];
      },
      set: function(value) {
        data[index] = value;
      }
    });
  });
  return obj;
};

api.jstp.connect = function(host, port) {
  var socket = new api.net.Socket();
  var connection = {};
  connection.socket = socket;
  connection.packetId = 0;

  connection.send = function(packet) {
    connection.socket.write(packet);
  };

  connection.call = function(interfaceName, methodName, parameters, callback) {
    var packet = {};
    connection.packetId++;
    packet.call = [connection.packetId, interfaceName];
    packet[methodName] = parameters;
    connection.send(packet);
  };

  connection.event = function(interfaceName, eventName, parameters) {
    var packet = {};
    connection.packetId++;
    packet.event = [connection.packetId, interfaceName];
    packet[eventName] = parameters;
    connection.send(packet);
  };

  socket.connect({
    port: port,
    host: host,
  }, function() {
    socket.write();
    socket.on('data', function(data) {
    
    });
  });

  return connection;
};


