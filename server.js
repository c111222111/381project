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
  keys:['Please give me A','Donny GG']
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
	var notfound1 = true;
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
											if((notfound) && (correct)&&(notfound1)){				
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
								}else{
									if(result.username == user){
										notfound1 = false;
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

app.post('/vo',function(req,res){
		console.log("Hello");
		insertvote(req,res);
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
	
	new_r['grades'] = [];
	/*var grades = [];
	grades['user'] = req.session.userID;
	grades['score'] = (queryAsObject.score)? queryAsObject.score : '';
	new_r['grades'] = grades;*/
	new_r['photo-mimetype'] = '';
	new_r['photo'] = '';
	try{
		new_r['photo-mimetype'] = req.files.filetoupload.mimetype;
		new_r['photo'] = new Buffer(req.files.filetoupload.data).toString('base64');
		console.log('Have Photo');
	}catch(err){
		console.log('No Photo');
	}
	

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
											inserting(user,score,id,db,function(result){
												res.status(200);
												res.end('Vote successful');
											});
										}
								}else{
								for(var i=0;i<result.grades.length;i++){
									if(result.grades[i].user == user){
										usernotfound = false;
										res.status(200);
										res.end("You have already voted");
									
									}
								}
				
									}
				});
	});
	
	
}

function inserting(user,score,id,db,callback){
	console.log(user,score,id);
	var new_r = {};
	var grades = {};
	grades['user'] = user;
	grades['score'] = score;
	
	new_r['grades'] = grades;
	var criteria = {};
	criteria['_id'] = ObjectID(id);
	
	//do insert
	db.collection('rest').updateOne(criteria,{$push:new_r},function(err,result){
		assert.equal(err,null);
		console.log('Vote Successfully');
		callback(result);
	});
	
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
	

	new_r['grades'] = []
	/*var grades = [];
	grades['user'] = req.session.userID;
	grades['score'] = (queryAsObject.score)? queryAsObject.score : '';
	new_r['grades'] = grades;*/

	new_r['owner'] = req.session.userID;
	console.log(new_r);
	
	
	new_r['photo'] = '';
	new_r['photo-mimetype']='';
	
	try{
		console.log(req.files);
		new_r['photo-mimetype'] = req.files.filetoupload.mimetype;
		new_r['photo'] = new Buffer(req.files.filetoupload.data).toString('base64');
		console.log('Have Photo');
	}catch(err){
		console.log('No Photo');
	}
		

	MongoClient.connect(mongourl,function(err,db) {
		assert.equal(err,null);
		console.log('Connected to MongoDB\n');
		
		insertRest(db,new_r,function(result) {
			db.close();
			console.log("inserting");
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
				//console.log(details);
				if(details[0].photo==''){
				res.render("detail",{d:details});
				console.log("No photo display");
				}else{
					console.log("display Photo");				
					res.render("detailphoto",{d:details})
				}
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
				console.log("redirect to vote");
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
			res.end("delete success!");			
		});
	});
}


function deleteRestaurant(db,criteria,callback) {
	db.collection('rest').deleteMany(criteria,function(err,result) {
		assert.equal(err,null);
		console.log("Deleting");
		callback(result);
	});
}

