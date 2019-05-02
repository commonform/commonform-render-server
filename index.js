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

var AJV = require('ajv')
var parseMarkup = require('commonform-markup-parse')
var renderers = require('./renderers')

var ajv = new AJV()
var validRequest = ajv.compile(require('./request.schema.json'))

module.exports = function (request, response) {
  var chunks = []
  request
    .on('data', function (chunk) {
      chunks.push(chunk)
    })
    .once('error', serverError)
    .once('end', function () {
      var body = Buffer.concat(chunks)
      var parsedRequest
      try {
        parsedRequest = JSON.parse(body)
      } catch (error) {
        return clientError('invalid json')
      }
      if (!validRequest(parsedRequest)) {
        return clientError('invalid request')
      }

      // Parse form.
      var form
      var formData = parsedRequest.form.data
      if (parsedRequest.form.format === 'json') {
        try {
          form = JSON.parse(formData)
        } catch (error) {
          return clientError('invalid form JSON')
        }
      } else if (parsedRequest.form.format === 'markup') {
        try {
          form = parseMarkup(formData).form
        } catch (error) {
          return clientError('invalid form markup')
        }
      }

      // Render form.
      var renderer = renderers[parsedRequest.render]
      if (!renderer) return clientError('unknown renderer')
      var rendered = renderer(form)

      response.statusCode = 200
      response.end(rendered)
    })

  function serverError (error) {
    request.log.error(error)
    response.statusCode = 500
    response.end(error.toString())
  }

  function clientError (error) {
    request.log.info(error)
    response.statusCode = 400
    response.end(error.toString())
  }
}
