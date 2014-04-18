var sqlite3 = (process.env.NODE_ENV == "development") ? require('sqlite3').verbose() : require('sqlite3'),
    db = new sqlite3.Database('./data/db');


db.serialize(function(){
  var TABLE = "CREATE TABLE IF NOT EXISTS offers (id INTEGER PRIMARY KEY, offer_id TEXT, description TEXT, type TEXT)"
  db.run(TABLE)
  //seedDB();
});

function seedDB(){
  var offers = { 
      "b34ba460-aceb-477a-9c30-5f1c78b75272": "complete 2 secondary, no creative",
      "ff070656-3197-4cf5-a258-98370ecdff50": "complete no end card creative",
      "f578f935-63b0-4124-a37a-8b95a26ed2aa": "complete deprecated end card creative no brand logo",
      "fbfe7fa4-53d4-44ff-a2a2-e4e6d9198a1d": "complete deprecated end card creative, brand logo",
      "fedc1682-559a-4b15-80fb-6f0a2ab0cddf": "complete deprecated end card creative, big brand logo",
      "878c999a-4965-4e05-b3ec-ccdf1ddd34dc": "complete new end card creative",
      "e9bea55c-a084-41a0-b6b1-d3c6e9ff5e09": "geo location",
      "3a3a307f-b80b-436a-b64d-4762965a3147": "third party vast",
      "a89f6c1f-7215-4cce-af5a-2fec0261c5fd": "complete new end card creative tall brand logo",
      "8956a37a-0d70-4ee3-b264-bb1d2f05a170": "complete 2 buttons, end creative"
    },
    insert = db.prepare("INSERT INTO offers VALUES (NULL,?,?,?)");

  for(var id in offers){
    insert.run(id,offers[id],"complete")
  }
}

exports.getAll = function(cb){
  db.all("SELECT * FROM offers",function(err,data){
    cb(err,data)
  })
}
exports.insert = function(offer_id,description,type,cb){
  var insert = db.prepare("INSERT INTO offers VALUES (NULL,?,?,?)");
  insert.run(offer_id,description,type,cb)
}
exports.db = db;