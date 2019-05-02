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
var tape = require('tape')

var RANDOM_HIGH_PORT = 0

tape('simple markdown', function (test) {
  var text = 'tiny form text'
  strictEqual(
    {
      render: 'markdown',
      form: {
        format: 'json',
        data: JSON.stringify({
          content: [text]
        })
      }
    },
    text,
    test
  )
})

tape('markdown with heading', function (test) {
  strictEqual(
    {
      render: 'markdown',
      form: {
        format: 'json',
        data: JSON.stringify({
          content: [
            {
              heading: 'Test Heading',
              form: {
                content: ['form text']
              }
            }
          ]
        })
      }
    },
    [
      '# <a id="Test_Heading"></a>Test Heading',
      '',
      'form text'
    ].join('\n'),
    test
  )
})

tape('markup', function (test) {
  strictEqual(
    {
      render: 'markdown',
      form: {
        format: 'markup',
        data: '    \\Test Heading\\ form text'
      }
    },
    [
      '# <a id="Test_Heading"></a>Test Heading',
      '',
      'form text'
    ].join('\n'),
    test
  )
})

function strictEqual (request, expected, test) {
  withTestServer(function (port, close) {
    http.request({ port, method: 'POST' })
      .once('response', function (response) {
        var chunks = []
        response
          .on('data', function (chunk) {
            chunks.push(chunk)
          })
          .once('error', function (error) {
            test.ifError(error)
          })
          .once('end', function () {
            var content = Buffer.concat(chunks).toString()
            test.strictEqual(content, expected, 'renders expected')
          })
        close()
        test.end()
      })
      .end(JSON.stringify(request))
  })
}

function withTestServer (callback) {
  var serverLog = pino({ enabled: false })
  var logger = pinoHTTP({ logger: serverLog })
  var server = http.createServer(function (request, response) {
    logger(request, response)
    handler(request, response)
  })
  server.listen(RANDOM_HIGH_PORT, function () {
    callback(server.address().port, function () {
      server.close()
    })
  })
}
