
require('dotenv').config()
//"https://github.com/mateioprea/node-oxford"
var oxfordEmotion = require("node-oxford-emotion")(process.env.API_KEY);
var _ = require('lodash');



var express = require('express')
var app = express()
var bodyParser = require('body-parser')
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
	extended: true
}));


function gethighRate(scores){
	//var score = d[0].scores
	let res  = [];
	for (let i in scores) {
		res.push({score: scores[i] ,name: i  })
	}
	const arr = _.sortBy(res, 'score').reverse();
	return [arr[0].name, arr[1].name ];
}



app.get('/', function (req, res) {
  res.send('ready!')
})
app.get('/image', function (req, res) {

	const imgUrl = req.param("image") ;
	if (imgUrl !== "undefined") {
		oxfordEmotion.recognize("url", imgUrl, function(payload) {
			const key = gethighRate(payload[0].scores)
			res.send(key)
		});
	} else {
		res.send({message:"No image"})
	}

});
app.post('/image', function (req, res) {
	if (req.body.image !== "undefined") {
		var emotion = oxfordEmotion.recognize("image", req.body.image , function(payload) {
			const key = gethighRate(payload[0].scores)
			res.send(key);
		});
	} else {
		res.send({message:"No image"})
	}

});



app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
