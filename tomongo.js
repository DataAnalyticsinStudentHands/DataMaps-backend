var _ = require('underscore');
var fs = require('fs');
//var jsonarray = [];

// Import mapping json file to map folder name to siteRef
var mapping = JSON.parse(fs.readFileSync('folder2siteRef.js', 'utf8'));
var MongoClient = require('mongodb').MongoClient;
var today = new Date();

//var yearfolder  = today.getFullYear().toString();
var dataFolder = '/hnet/incoming/' + today.getFullYear();

var subfolder = fs.readdirSync(dataFolder);  // read the list of subfolder, which are sites
var fileList =[];
var fields=[];
var tempRecord=null;
var recordArray = null;
var jsonarray = [];

MongoClient.connect('mongodb://127.0.0.1:27017/test3', function(err, db) {    
    if (err) throw err;
    console.log("Connected to mongodb!");    

    _.forEach(subfolder, function(folder) {
    	console.log('Reading folder: ' + folder);

    	fileList = fs.readdirSync(dataFolder + '/' + folder); // array of files in a folder

    	for (var z=101; z<=200; z++) { // read only 100 files at a time
		
			console.log('Reading file: ' + fileList[z]);		
	        recordArray = fs.readFileSync(dataFolder+'/'+folder+'/'+fileList[z]).toString().split("\r\n");
	        for (i in recordArray) {
	        	recordArray[i] = recordArray[i].split(",");
	        };
	        fields = recordArray[0]; // choose the first element of the array to be fields
	        recordArray.shift(); recordArray.pop(); // remove first and last element
	        
			for (i in recordArray) {
	        	tempRecord = _.object(fields, recordArray[i]);
				tempRecord['siteRef'] = mapping[folder];
				tempRecord['epoch'] = parseInt((tempRecord['TheTime'] - 25569) * 86400) + 6*3600;
	        	jsonarray.push(tempRecord);	
	        }; 
			// insert the whole array into the hnet collection	               
	        db.collection('hnet').insert(jsonarray);	

			jsonarray.length = 0;       // deallocate jsonarray
			recordArray.length = 0;    // deallocate recordArray
  		}; 
	});        
      db.close();    
});



