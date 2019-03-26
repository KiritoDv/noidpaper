var MongoClient = require('mongodb').MongoClient;
var properties = require('./properties')

class ImageDB{

    connect(){
        return new Promise((resolve, reject) =>{
            var url = `mongodb://${properties.db.user}:${properties.db.pass}@${properties.db.ip}/${properties.db.database}`;

            MongoClient.connect(url, { useNewUrlParser: true })
                .then(db => {                
                    this.ImageDB = db.db(properties.db.database).collection(properties.db.collection);
                    resolve();
                })
                .catch(err => console.error(err));        
        })
    }

    uploadWallpaper (json){
        return new Promise((resolve, reject) =>{
            this.ImageDB.findOne({ path: json.path }, (err, path) => {
                if (path) {                    
                    return reject({code: 501, msg: 'Wallpaper already registered'});
                } else {
                    this.ImageDB.insertOne({path: json.path, width: json.width, height: json.height, type: json.type, remote: json.remote}, (error, res) => {
                        if (error) {                                        
                            return reject(error)                            
                        } else {                            
                            return resolve({code: 200, msg: 'Wallpaper succefully registered'});
                        }
                    });
                }
            }); 
        })
    }
    
    getImageList() {
        return new Promise((resolve, reject) =>{
            this.ImageDB.find().toArray((err, image) => {                
                if (err) {
                    return reject({code: 503, msg: err});
                } else {                    
                    return resolve(image);
                }
            }); 
        })
    }
}

module.exports = ImageDB;