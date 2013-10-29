var restify = require('restify')
  , bunyan = require('bunyan')
  , async = require('async')
  , _ = require('lodash')
  , serviceLocator = require('service-locator').createServiceLocator()
  , mongoose = require('mongoose')
  , mongohq = require('./models/mongohq')
  , commits = require('./models/save-commits')
  , repository = require('./models/save-repos')

serviceLocator.register('logger', bunyan.createLogger({name: 'github-stats'}))

var server = restify.createServer({ name: 'github-stats' })
 
server
  .use(restify.fullResponse())
  .use(restify.bodyParser())

server.post('/hook', function (req, res, next) {
  
  var gitHookData = JSON.parse(req.params.payload)

  if (gitHookData) {
    serviceLocator.logger.info('Getting git hook data')

    // Loop through the commits then save them
    commits.saveCommits(gitHookData)

    // Save the repository information
    repository.saveRepo(gitHookData)

  } else {
    serviceLocator.logger.info('No POST data received :(')
  }

  res.end()

})

server.get('/commits/day', function (req, res, next) {
  mongohq.getCommits(function(error, commits){
    if (error){
      serviceLocator.logger.error(error)
    } else {
      serviceLocator.logger.info('Getting git commits for the week')
      res.json(commits)
    }
  })
})

server.listen(3010, function () {
  serviceLocator.logger.info('%s listening at %s', server.name, server.url)
})