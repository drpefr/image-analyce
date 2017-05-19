
require('dotenv').config()
//"https://github.com/mateioprea/node-oxford"
var oxfordEmotion = require("node-oxford-emotion")(process.env.IMAGE_ANALYZE);
var _ = require('lodash');
var cors = require('cors');
var formidable = require('formidable');
var fs = require('fs');
const bodyParser = require('body-parser');
/**
 * AWS S3
 */
const S3FS = require('s3fs');
const awsConfig = require('./config/aws.js');
const s3Opts = {
	accessKeyId: awsConfig.accessKeyId,
	secretAccessKey: awsConfig.secretAccessKey
};
const s3fsImpl = new S3FS(awsConfig.bucketPath, s3Opts);

var express = require('express')
var app = express()
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
/**
 * Connect multi-party middleware
 */
const multiparty = require('connect-multiparty');
app.use(multiparty( {'maxFilesSize': 22000000000,'autoFiles': true} ));


function pushToS3(req, res, next) {

	if (req.files.file.originalFilename === "") next("missing file");
	else {
		const epocMili = (new Date().getTime() || Math.random(999999));
		const combinedFileName = "file-" + epocMili + "." + req.files.file.originalFilename.substring(req.files.file.originalFilename.lastIndexOf(".")+1);
		let file = req.files.file;
		let stream = fs.createReadStream(file.path);
			s3fsImpl.writeFile(combinedFileName, stream);
		next(null, combinedFileName);
	}
}


function gethighRate(scores){
	//var score = d[0].scores
	let res  = [];
	for (let i in scores) {
		res.push({score: scores[i] ,name: i  })
	}
	const arr = _.sortBy(res, 'score').reverse();
	let result = []
	result.push({type: arr[0].name, score:arr[0].score   } || {})
	result.push({type: arr[1].name, score:arr[1].score   } || {})
	return result;
}

function binaryRead(file) {
    var bitmap = fs.readFileSync(file);
    return new Buffer(bitmap.toString('binary'),'binary');
}



app.get('/', function (req, res) {
  res.send('ready!')
})
app.get('/image', function (req, res) {

	const imgUrl = req.param("image") || null ;
	if (imgUrl !== null) {
		oxfordEmotion.recognize("url", imgUrl, function(payload) {
			const key = gethighRate(payload[0].scores)
			res.send(key)
		});
	} else {
		res.send({message:"No image"})
	}

});

app.post('/image', function(req, res) {

	 pushToS3(req, res, function(err, filename){
		 if (err === null) {
	 		oxfordEmotion.recognize("url", awsConfig.fullPath+filename, function(payload) {
	 			const key = gethighRate(payload[0].scores)
	 			res.send(key)
	 		});
	 	} else {
	 		res.send({message:"No image"})
	 	}
	 })

	/*
	var form = new formidable.IncomingForm();

    form.parse(req);

    form.on('fileBegin', function (name, file){
        file.path = __dirname + '/temp/' + file.name;
    });

    form.on('file', function (name, file){

		let bin = binaryRead(file.path);

		oxfordEmotion.recognize("image", bin, function(payload) {
			let result =  JSON.parse(payload);
			if (result[0] !== undefined) {
				let key = gethighRate(result[0].scores);
				fs.unlinkSync(file.path)
				res.send(key);
			} else {
				fs.unlinkSync(file.path)
				res.send([]);
			}

		});
    });
	*/
})


app.listen(process.env.PORT, function () {
  console.log('Example app listening on port', process.env.PORT)
})
