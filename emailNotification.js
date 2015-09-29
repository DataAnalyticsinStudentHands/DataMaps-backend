var fs = require('fs');
var _ = require('underscore');
var nodemailer = require('nodemailer');
var directTransport = require('nodemailer-direct-transport');
var path = '/hnet/incoming/2015/';
var watchedFolders = fs.readdirSync(path);

var currentTime;
var timeDiff;

var loop = setInterval ( function() {
	currentTime = new Date();
	_.each(watchedFolders, function(aFoler) {
		fs.stat(path + aFoler, function(err, stats) {	
			timeDiff = new Date(currentTime - Date.parse(stats['atime']));
			timeDiffinMinutes = parseInt(timeDiff.getTime()/(1000*60));
			var emailNote = 'It looks like site ' + aFoler + ' has been down for ' + timeDiffinMinutes + " minutes.";
			if (timeDiffinMinutes > 30) {
				sendEmail(emailNote);			
			}
			console.log("Folder ", aFoler, " was updated ", timeDiffinMinutes, " minutes ago");			
		});
	});
}, 1*60*1000);

function sendEmail(note) {
	/*var transporter = nodemailer.createTransport(smtpTransport({
		host: 'localhost',
		port: 25,
		auth: {
			user: 'huy.hoang711@gmail.com',
			pass: 'Yinyang071187@'
		}
	});*/
	var transporter = nodemailer.createTransport(directTransport());
	var mailOptions = {
		from: 'Hnet <admin@hnet>',
		to: 'huy.hoang711@gmail.com, plindner@central.uh.edu',
		subject: 'Site\'s down',
		text: note
	};

	transporter.sendMail(mailOptions, function(error, info) {
		if (error) {
			console.log("Can not send email. Error: ", error);
		} else {
			console.log("Message sent!");
		}
	});
};