var Async = require('async');
var Csv = require('csv-streamify');
var Es = require('event-stream');
var Fs = require('fs');
var Mapping = require('./folder2siteRef.json');
var MongoClient = require('mongodb').MongoClient;

var sourcePath = '/hnet/incoming/' + new Date().getFullYear();

Async.auto({
  db: function (callback) {
    console.log('opening db connection');
    MongoClient.connect('mongodb://localhost:27017/test3', callback);
  },
  subDirectory: function (callback) {
    // read the list of subfolder, which are sites
    Fs.readdir(sourcePath, callback);
  },
  loadData: ['db', 'subDirectory', function (callback, results) {
    Async.each(results.subDirectory, load(results.db), callback);
  }],
  cleanUp: ['db', 'loadData', function (callback, results) {
    console.log('closing db connection');
    results.db.close(callback);
  }]
}, function (err) {
  console.log(err || 'Done');
});

var load = function (db) {
  return function (directory, callback) {
    var basePath = sourcePath + '/' + directory;
    Async.waterfall([
      function (callback) {
        Fs.readdir(basePath, callback); // array of files in a directory
      },
      function (files, callback) {
        console.log('loading ' + files.length + ' files from ' + directory);
        Async.each(files, function (file, callback) {
          Fs.createReadStream(basePath + '/' + file)
            .pipe(Csv({objectMode: true, columns: true}))
            .pipe(transform(directory))
            .pipe(batch(200))
            .pipe(insert(db).on('end', callback));
        }, callback);
      }
    ], callback);
  };
};

var transform = function (directory) {
  return Es.map(function (data, callback) {
    data.siteRef = Mapping[directory];
    data.epoch = parseInt((data.TheTime - 25569) * 86400) + 6 * 3600;
    callback(null, data);
  });
};

var insert = function (db) {
  return Es.map(
    function (data, callback) {
      if (data.length) {
        var bulk = db.collection('hnet').initializeUnorderedBulkOp();
        data.forEach(function (doc) {
          bulk.insert(doc);
        });
        bulk.execute(callback);
      } else {
        callback();
      }
    }
  );
};

var batch = function (batchSize) {
  batchSize = batchSize || 1000;
  var batch = [];

  return Es.through(
    function write (data) {
      batch.push(data);
      if (batch.length === batchSize) {
        this.emit('data', batch);
        batch = [];
      }
    },
    function end () {
      if (batch.length) {
        this.emit('data', batch);
        batch = [];
      }
      this.emit('end');
    }
  );
};