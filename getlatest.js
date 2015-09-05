var _ = require('underscore');
var fs = require('fs');

// Import mapping json file to map folder name to siteRef
var mapping = JSON.parse(fs.readFileSync('folder2siteRef.js', 'utf8'));
var MongoClient = require('mongodb').MongoClient;

var yearfolder = '2015';

var subfolder = fs.readdirSync(yearfolder);  // read the list of subfolder, which are sites
setInterval(function() {
MongoClient.connect('mongodb://127.0.0.1:27017/test3', function(err, db) {    
    if (err) throw err;
    console.log("Connected to mongodb!");    

    _.forEach(subfolder, function(folder) {
            
    var files = fs.readdirSync(yearfolder + '/' + folder);
 
        //Read in the last file only

            console.log('Reading file: ' + files[files.length-1]);
            var jsonarray = [];
            var recordArray = fs.readFileSync(yearfolder+'/'+folder+'/'+files[files.length-1]).toString().split("\r\n");
            for (i in recordArray) {
                    recordArray[i] = recordArray[i].split(",");
            };
            var key = recordArray[0];
            recordArray.splice(0,1); recordArray.splice(recordArray.length-1);
            for (i in recordArray) {
                    var tempRecord = _.object(key, recordArray[i]);
                    tempRecord['siteRef'] = mapping[folder];
		    tempRecord['epoch'] = parseInt((tempRecord['TheTime'] - 25569) * 86400) + 6*3600;
                    jsonarray.push(tempRecord);
            };
            
                db.collection('hnet').update(jsonarray[jsonarray.length-1], jsonarray[jsonarray.length-1], {upsert: true}, function(err) {
		 //if (err) console.log(err);	
		});    
		console.log("Lastest record added: " + JSON.stringify(jsonarray[jsonarray.length-1]));
            //};
      });
    db.close();
});
}, 5*60*1000);
