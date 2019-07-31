const validIp = (ip) => {
  const re = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/
  return re.test(ip)
}

const validPort = (port) => {
  return typeof port === "number";
}

module.exports = {validIp, validPort}