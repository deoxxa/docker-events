var events = require("events"),
    JSuck = require("jsuck");

var DockerEvents = module.exports = function DockerEvents(options) {
  events.EventEmitter.call(this, options);

  options = options || {};

  this.docker = options.docker;
  this.running = false;
};
DockerEvents.prototype = Object.create(events.EventEmitter.prototype, {constructor: {value: DockerEvents}});

DockerEvents.prototype.start = function start() {
  var self = this;

  this.running = true;

  this.docker.getEvents(function(err, res) {
    if (err) {
      return self.emit("error", err);
    }

    self.res = res;

    self.emit("connect");

    var parser = new JSuck();

    res.pipe(parser);

    parser.on("data", function(data) {
      self.emit("_message", data);
      self.emit(data.status, data);
    });

    parser.on("end", function() {
      self.emit("disconnect");
      self.res = null;

      if (self.running) {
        self.start();
      }
    });
  });

  return this;
};

DockerEvents.prototype.stop = function stop() {
  this.running = false;

  if (this.res) {
    this.res.destroy();
  }

  return this;
};
