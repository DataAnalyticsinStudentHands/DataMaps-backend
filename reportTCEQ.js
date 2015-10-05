var _ = require('underscore');
var MongoClient = require('mongodb').MongoClient;
var fs = require('fs');

MongoClient.connect('mongodb://127.0.0.1:27017/DataMaps', function(err, db) {
if (err) throw err;
else {
var fieldName =[];
var fieldString;
db.collection('LiveData5min').findOne({'siteRef': 'UHCCH_DAQData'}, {'_id': 0, 'TheTime' : 0}, function(err, doc) {
	if (err) throw err;
		for (var field in doc) {			
			fieldName.push(field);
		}		
		fs.appendFileSync('sampleReport.csv', (fieldName.toString() + '\n'));
});
var recString;
db.collection('LiveData5min').find({'siteRef': 'UHCCH_DAQData'}, {'_id': 0, 'TheTime' : 0}).sort({'epoch': 1}).limit(100).forEach(	
	function(rec) {		
	recString = '';
	for (var i in fieldName) {
		recString += rec[fieldName[i]];
		if (i != (fieldName.length -1))
			recString += ',';
		else 
			recString += '\n';
	}
	fs.appendFileSync('sampleReport.csv', recString);
	}
);
console.log('Finish reporting! Exit now!');
//db.close();
}
});