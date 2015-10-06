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
			if (field == 'epoch') {             // decompose epoch into 2 parts: date and time
				fieldName.push('dateGMT');  
				fieldName.push('timeGMT');
			} else 			
				fieldName.push(field);
		}		
		fs.appendFileSync('sampleReport.csv', (fieldName.toString() + '\n'));
});
var recString;
db.collection('LiveData5min').find({'siteRef': 'UHCCH_DAQData'}, {'_id': 0, 'TheTime' : 0}).sort({'epoch': 1}).limit(100).forEach(	
	function(rec) {		
	recString = '';

	for (var i in fieldName) {
		var anEpoch = new Date(rec['epoch']*1000);
		var yearString, dateString, monthString, hourString, minString, secString;
		if (fieldName[i] == 'dateGMT') {
			yearString = anEpoch.getUTCFullYear().toString().slice(2); // extract only the last 2 digits from Year
			monthString = anEpoch.getUTCMonth()+1;
			if (monthString < 10) monthString = '0' + monthString;    // adding '0' if smaller than 10
			dateString = anEpoch.getUTCDate(); 
			if (dateString < 10) dateString = '0' + dateString;        // adding '0' if smaller than 10

			recString += (yearString + '/'+ monthString + '/' + dateString);
		} else if (fieldName[i] == 'timeGMT') {
			hourString = anEpoch.getUTCHours();
			if (hourString < 10) hourString = '0' + hourString;
			minString = anEpoch.getUTCMinutes();
			if (minString < 10) minString = '0' + minString;
			secString = anEpoch.getUTCSeconds();
			if (secString < 10) secString = '0' + secString;

			recString += (hourString + ':' + minString + ':' + secString);
		} else if (fieldName[i].search('Flag') != -1) {
			recString += (parseInt(rec[fieldName[i]]) == 1) ? 'K' : 'N';
		} else {
			recString += rec[fieldName[i]];
		}		
			
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