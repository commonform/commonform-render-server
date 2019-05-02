#!/usr/bin/env node
/*
Copyright 2019 Kyle E. Mitchell

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
var handler = require('./')
var http = require('http')
var pino = require('pino')
var pinoHTTP = require('pino-http')

var serverLog = pino()
var logger = pinoHTTP({ logger: serverLog })

var server = http.createServer(function (request, response) {
  logger(request, response)
  handler(request, response)
})

var trap = function () {
  serverLog.info({ event: 'signal' })
  cleanup()
}
process.on('SIGTERM', trap)
process.on('SIGQUIT', trap)
process.on('SIGINT', trap)
process.on('uncaughtException', function (exception) {
  serverLog.error({ exception: exception })
  cleanup()
})

var port = process.env.PORT || 8080
server.listen(port, function () {
  var boundPort = this.address().port
  serverLog.info({ event: 'listening', port: boundPort })
})

function cleanup () {
  server.close(function () {
    serverLog.info({ event: 'closed' })
    process.exit(0)
  })
}
