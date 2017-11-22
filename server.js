var express = require('express');
var path = require('path');
var app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

var bodyParser = require('body-parser')
var fileUpload = require('express-fileupload');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectID = require('mongodb').ObjectID;
var ExifImage = require('exif').ExifImage;
var fs = require('fs');

var mongourl = "mongodb://admin:admin@ds141264.mlab.com:41264/s1178044";
var bodyParser = require('body-parser');

var session = require('cookie-session');


app.use(session({
  name:'session',
  keys:['Please give me A','Raymond So so handsome']
}));


app.use(fileUpload());
app.use(bodyParser.urlencoded({ extended: false }))


app.listen(process.env.PORT || 8099);

app.get('/', function(req,res) {
  res.redirect('/login');
});

app.get('/reg',function(req,res){
	res.status(200);
	res.render("registry");
	
});

app.post('/reg',function(req,res){
	var user = req.body.username;
	var pw = req.body.password;
	var repw = req.body.repassword;
	var notfound = false;
	var correct = false;
	
	if ((user && pw && repw) != ""){
		console.log(user,pw,repw);//checking
		if (pw == repw){
			 correct = true;
		//database insert
			MongoClient.connect(mongourl, function(err,db) {
				assert.equal(err,null);
				console.log('Connected to MongoDB');
			
				var new_user = {};
				new_user['username'] = user;
				new_user['password'] = pw;
			
				db.collection('User').find({});
				var alldata = db.collection("User").find({});
				alldata.each(function(err,result){
					assert.equal(err,null);
					console.log("Checking from DB");
								if(result == null){
										db.close;
										notfound = true;
								}else{
									if(result.username == user){
										res.status(200);
										res.end("User already Exist");
									}
				
					}
				});
				
			});
			
		}else{
			res.status(200);
			res.end("Password are not the same");
		}
	}else{
		res.status(200);
		res.end("All field need fill");
	}
	//console.log("2",notfound);
	//console.log(correct);
	if((notfound) && (correct)){				
				MongoClient.connect(mongourl, function(err,db){
				assert.equal(err,null);
				
				var new_user = {};
				new_user['username'] = user;
				new_user['password'] = pw;
				
				reg2DB(db,new_user,function(result){
									db.close();
									res.status(200);
									res.end('User Created');
				});
				});		
	}
});


app.get('/login',function(req,res){
	res.status(200);
	res.render("login");
	
});

app.post('/login',function(req,res){
	
	res.status(200);
	var user = req.body.username;
	var pw = req.body.password;
	
	MongoClient.connect(mongourl,function(err,db){
		assert.equal(err,null);
		console.log('Connected to MongoDB');
		
		var alldata = db.collection("User").find({});
		alldata.each(function(err,result){
			assert.equal(err,null);
			console.log("Checking from DB");
			if(result == null){
				db.close;
				res.status(200);
				res.end("No User Record");
			}else{
				if(result.username == user){
					if(result.password == pw){
						res.status(200);
						req.session.userID = user;
						res.redirect('/hello');
					}else{
						res.status(200);
						res.end("Password unmatch");
					}
				}
				
			}
			
		});
	});
	

	
	
});


app.get('/hello',function(req,res,next){//check session
	if(req.session.userID){
		res.redirect('/read');
	}else{
		res.redirect('/login');
	}
});


app.get('/create', function(req,res) {
	if(req.session.userID){
		res.render("create");
	}else{
		res.redirect('/login');
	}
});

app.post('/fileupload', function(req,res) {
/*	if(req.files != "undefined"){
	var filename = req.files.filetoupload.name;
	var mimetype = req.files.filetoupload.mimetype;
	console.log(filename,mimetype);
	var image = {};
	image['image'] = filename;

	fs.readFile(filename, function(err,data) {
      var new_r2 = {};
      new_r2['photo-mimetype'] = mimetype;
      new_r2['photo'] = new Buffer(data).toString('base64');
	});
	}else{
		var new_r2 = {};
		new_r2['photo-mimetype'] ='';
		new_r2['photo'] ='';
	}*/
	var new_r2 = {};
	createRest(req,res);	
});

app.get('/logout',function(req,res){
	req.session = null;
	res.redirect('/login');
	
});

app.get('/read',function(req,res){
	read_n_print(res);
});

app.get('/vote',function(req,res){
	if(req.session.userID){
		vote(res);
	}else{
		res.redirect('login');
	}
});

app.get('/voteto',function(req,res){
	if(req.query._id == null){
		res.end("Not Found!")
	}else{
		voteto(res,req.query._id);
	}
});


app.get('/detail',function(req,res){
	if(req.query._id == null){
		res.end("No Restaurant Find!")
	}else{
		showdetail(res,req.query._id);
	}
});

app.post('/voteto',function(req,res){
	if(req.session.userID){
		insertvote(req,res);
	}
});


app.post('/update',function(req,res){
	if(req.session.userID){
	queryAsObject = req.body;
	if (queryAsObject.owner == req.session.userID){
		update(req,res);
	}else{
		res.end('You are not the Owner!');
	}
	}else{
		res.redirect('/login');
	}
	
});

app.post('/delete',function(req,res){
	if(req.session.userID){
	queryAsObject = req.body;
		if(req.session.userID == queryAsObject.owner){
		del(req,res);
		}else{
		res.end("You are not the Owner");
		}
	}
	else{
		res.redirect('login');
	}
	
});


/*000000000000000000000000000000000000000*/
app.get('/new', function(req,res) {
  res.status(200);
  res.render("upload");
});


app.get('/photos', function(req,res) {
  console.log('/photos');
  MongoClient.connect(mongourl, function(err,db) {
    assert.equal(err,null);
    console.log('Connected to MongoDB');
    findPhoto(db,{},{_id:1,title:1},function(photos) {
      db.close();
      console.log('Disconnected MongoDB');
      res.status(200);
      res.render("list",{p:photos});
    })
  });
});


app.get('/display', function(req,res) {
  MongoClient.connect(mongourl, function(err,db) {
    assert.equal(err,null);
    console.log('Connected to MongoDB');
    var criteria = {};
    criteria['_id'] = ObjectID(req.query._id);
    findPhoto(db,criteria,{},function(photo) {
      db.close();
      console.log('Disconnected MongoDB');
      console.log('Photo returned = ' + photo.length);
      console.log('GPS = ' + JSON.stringify(photo[0].exif.gps));
      var lat = -1;
      var lon = -1;
      if (photo[0].exif.gps &&
          Object.keys(photo[0].exif.gps).length !== 0) {
        var lat = gpsDecimal(
          photo[0].exif.gps.GPSLatitudeRef,  // direction
          photo[0].exif.gps.GPSLatitude[0],  // degrees
          photo[0].exif.gps.GPSLatitude[1],  // minutes
          photo[0].exif.gps.GPSLatitude[2],  // seconds
        );
        var lon = gpsDecimal(
          photo[0].exif.gps.GPSLongitudeRef,
          photo[0].exif.gps.GPSLongitude[0],
          photo[0].exif.gps.GPSLongitude[1],
          photo[0].exif.gps.GPSLongitude[2],
        );
      }
      console.log(lat,lon);      
      res.status(200);
      res.render("photo",{p:photo[0],lat:lat,lon:lon});
    });
  });
});

app.get('/map', function(req,res) {
  res.render('gmap.ejs',
             {lat:req.query.lat,lon:req.query.lon,title:req.query.title});
});


function insertPhoto(db,r,callback) {
  db.collection('photos').insertOne(r,function(err,result) {
    assert.equal(err,null);
    console.log("insert was successful!");
    console.log(JSON.stringify(result));
    callback(result);
  });
}

function reg2DB(db,new_user,callback){
	db.collection('User').insertOne(new_user,function(err,res){
	assert.equal(err,null);
	console.log("User insert to DB successfully");
	callback(res);
	});		
	
	
}
function insertRest(db,r,callback) {
	db.collection('rest').insertOne(r,function(err,result) {
		assert.equal(err,null);
		console.log("Insert was successful!");
		callback(result);
	});
}


function update(req,res){
	console.log('update');
	queryAsObject = req.body;
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
	
		queryAsObject = req.body;
	var new_r = {};
	if (queryAsObject.rid) new_r['rid'] = queryAsObject.rid;
	if (queryAsObject.name) new_r['name'] = queryAsObject.name;
	if (queryAsObject.borough) new_r['borough'] = queryAsObject.borough;
	if (queryAsObject.cuisine) new_r['cuisine'] = queryAsObject.cuisine;
	
	var address = {};
	address['street'] = (queryAsObject.street) ? queryAsObject.street:'';
	address['building'] = (queryAsObject.building) ? queryAsObject.building:'';
	address['zipcode'] = (queryAsObject.zipcode) ? queryAsObject.zipcode:'';
	
	address['coord'] = [2];
	address['coord'][0] = (queryAsObject.lon) ? queryAsObject.lon : '';
	address['coord'][1] = (queryAsObject.att) ? queryAsObject.att : '';
	
	new_r['address'] = address;
	

	var grades = {};
	grades['user'] = req.session.userID;
	grades['score'] = (queryAsObject.score)? queryAsObject.score : '';
	new_r['grades'] = grades;

	new_r['owner'] = req.session.userID;
	
	var criteria = {};
	criteria['_id'] = ObjectID(queryAsObject.id);
	
	
	updateRestaurant(db,criteria,new_r,function(result) {
			db.close();
			res.writeHead(200, {"Content-Type": "text/plain"});
			res.end("update was successful!");			
		});
	});
	
}

function insertvote(req,res){
	var notfound = false;
	var usernotfound = true;
	var id = req.body.id;
	var criteria = {};
	criteria['_id'] = ObjectID(req.body.id);	
	var user = req.session.userID;
	var score = req.body.score;
	
	MongoClient.connect(mongourl, function(err,db) {
				assert.equal(err,null);
				console.log('Connected to MongoDB');
			
				
				var alldata = db.collection("rest").find(criteria);
				alldata.each(function(err,result){
					assert.equal(err,null);
					console.log("Checking from DB");
								if(result == null){								
										notfound = true;
										console.log(notfound,usernotfound);
										if(usernotfound==true){
											inserting(user,score,id);
										}
								}else{
									if(result.grades.user == user){
										usernotfound = false;
										res.status(200);
										res.end("You have already voted");
									
									}
				
									}
				});
	});
	
	
}

function inserting(user,score,id){
	console.log(user,score,id);
	var grades = {};
	grades['user'] = user;
	grades['score'] = score;
	var criteria = {};
	criteria['_id'] = ObjectID(id);
	
	//How to do insert?
	
	
}



function createRest(req,res) {
 
	queryAsObject = req.body;
	console.log(queryAsObject);
	var new_r = {};
	//new_r['photo-mimetype'] = new_r2['photo-mimetype'];
	//new_r['photo'] = new_r2['photo'];
	if (queryAsObject.rid) new_r['rid'] = queryAsObject.rid;
	if (queryAsObject.name) new_r['name'] = queryAsObject.name;
	if (queryAsObject.borough) new_r['borough'] = queryAsObject.borough;
	if (queryAsObject.cuisine) new_r['cuisine'] = queryAsObject.cuisine;
	
	var address = {};
	address['street'] = (queryAsObject.street) ? queryAsObject.street:'';
	address['building'] = (queryAsObject.building) ? queryAsObject.building:'';
	address['zipcode'] = (queryAsObject.zipcode) ? queryAsObject.zipcode:'';
	/*
	if (queryAsObject.lon && queryAsObject.att){
		address['coord']=[2];
		address['coord'][0] = queryAsObject.lon;
		address['coord'][1] = queryAsObject.att;
	}*/
	address['coord'] = [2];
	address['coord'][0] = (queryAsObject.lon) ? queryAsObject.lon : '';
	address['coord'][1] = (queryAsObject.att) ? queryAsObject.att : '';
	
	new_r['address'] = address;
	

	var grades = {};
	grades['user'] = req.session.userID;
	grades['score'] = (queryAsObject.score)? queryAsObject.score : '';
	new_r['grades'] = grades;

	new_r['owner'] = req.session.userID;
	console.log(new_r);
	
		
	

	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		
		insertRest(db,new_r,function(result) {
			db.close();
			console.log(JSON.stringify(result));
			res.end('Insert Successfully');
		});
	});
}

function read_n_print(res){
	MongoClient.connect(mongourl,function(err,db){
		assert.equal(err,null);
		findRestaurants(db,{},function(restaurants){
			db.close();
			if(restaurants.length == 0){
				res.end('Not Found!');
			}else{
				res.render("rest",{r:restaurants});
				//res.render("list",{p:photos});
			}
		});
		
	});
}
function vote(res){
	MongoClient.connect(mongourl,function(err,db){
		assert.equal(err,null);
		findRestaurants(db,{},function(restaurants){
			db.close();
			if(restaurants.length == 0){
				res.end('Not Found!');
			}else{
				res.render("vote",{r:restaurants});
				//res.render("list",{p:photos});
			}
		});
		
	});
}


function showdetail(res,_id){
	var criteria = {};
	criteria['_id'] = ObjectID(_id);
	MongoClient.connect(mongourl,function(err,db){
		assert.equal(err,null);
		findRestaurants(db,criteria,function(details){
			db.close();
			if(details.length == 0){
				res.end('Not Found!');
			}else{
				console.log(details);
				res.render("detail",{d:details});
			}
		});
		
	});
}

function voteto(res,_id){
	var criteria = {};
	criteria['_id'] = ObjectID(_id);
	MongoClient.connect(mongourl,function(err,db){
		assert.equal(err,null);
		findRestaurants(db,criteria,function(details){
			db.close();
			if(details.length == 0){
				res.end('Not Found!');
			}else{
				console.log(details);
				res.render("voteto",{d:details});
			}
		});
		
	});
}


function findRestaurants(db,criteria,callback){
	var restaurants = [];
	cursor = db.collection('rest').find(criteria);
	cursor.each(function(err, doc) {
		assert.equal(err, null); 
		if (doc != null) {
			restaurants.push(doc);
		} else {
			callback(restaurants); 
		}
	});
}

function updateRestaurant(db,criteria,newValues,callback) {
	db.collection('rest').updateOne(
		criteria,{$set: newValues},function(err,result) {
			assert.equal(err,null);
			console.log("update was successfully");
			console.log(JSON.stringify(newValues));
			callback(result);
	});
}

function del(req,res){
	queryAsObject = req.body;
	var criteria = {};
	criteria['_id'] = ObjectID(queryAsObject.id);
	
	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		deleteRestaurant(db,criteria,function(result) {
			db.close();
			console.log(JSON.stringify(result));
			res.writeHead(200, {"Content-Type": "text/plain"});
			res.end("delete was successful!");			
		});
	});
}


function deleteRestaurant(db,criteria,callback) {
	db.collection('rest').deleteMany(criteria,function(err,result) {
		assert.equal(err,null);
		console.log("Delete was successfully");
		callback(result);
	});
}

function deletePhoto(db,criteria,callback) {
  db.collection('photos').deleteMany(criteria,function(err,result) {
    assert.equal(err,null);
    console.log("delete was successful!");
    console.log(JSON.stringify(result));
    callback(result);
  });
}

function findPhoto(db,criteria,fields,callback) {
  var cursor = db.collection("photos").find(criteria);
  var photos = [];
  cursor.each(function(err,doc) {
    assert.equal(err,null);
    if (doc != null) {
      photos.push(doc);
    } else {
      callback(photos);
    }
  });
}

function gpsDecimal(direction,degrees,minutes,seconds) {
  var d = degrees + minutes / 60 + seconds / (60 * 60);
  return (direction === 'S' || direction === 'W') ? d *= -1 : d;
}
