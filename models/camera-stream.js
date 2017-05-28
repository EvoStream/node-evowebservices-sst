var path = require('path');
var loki = require('lokijs');

var winston = require('winston');

// var db = new loki(path.join(__dirname, '../data/camerastream.json'));


var db = new loki(path.join(__dirname, '../data/camerastream.json'),
    {
        autoload: true
    });

/*
 * Local User
 */
exports.create = function (camerastream, next) {
    winston.log("info", '[evowebservices-sst] add camera stream');

    //load the database
    db.loadDatabase({}, function () {

        var camerastreams = null;

        //get the users collection
        camerastreams = db.getCollection('camerastreams');

        if ((typeof(camerastreams) == "undefined") || camerastreams === null) {

            //add the camerastreams collection if it does not exist
            camerastreams = db.addCollection('camerastreams');

        } else {

            var cameraStreamList = camerastreams.addDynamicView('cameraStreamListView');
            cameraStreamList.applyFind({'streamname': camerastream.streamname.toString()});

            if (cameraStreamList.data().length > 0) {

                var response = {
                    error: 'Camera Stream already exists.'
                };
                winston.log("error", '[evowebservices-sst] create - Camera Stream already exists');
                return next(response);

            }
        }

        winston.log("verbose", "[evowebservices-sst] create - " + JSON.stringify(camerastream));

        //insert the camera stream
        camerastreams.insert(camerastream);

        //save the database
        db.saveDatabase();

        //load the saved camera stream, need to use dynamic
        var updatedCameraStreamList = camerastreams.addDynamicView('updatedCameraStreamListView');
        updatedCameraStreamList.applyFind({'streamname': camerastream.streamname.toString()});

        return next(updatedCameraStreamList.data());
    });

};

exports.find = function (streamname, camerastream) {

    winston.log("info", '[evowebservices-sst] find camera stream');

    //load the database
    db.loadDatabase({}, function () {

        //get the camera streams collection
        var camerastreams = db.getCollection('camerastreams');

        // winston.log("verbose", "camerastreams " + JSON.stringify(camerastreams));

        if ((typeof(camerastreams) == "undefined") || camerastreams === null ) {
            var response = {
                error: 'there are no existing camera streams'
            };
            winston.log("error", '[evowebservices-sst] find - there are no existing camera streams');
            return camerastream(response);

        } else {

            var updatedCameraStreamList = camerastreams.addDynamicView('updatedCameraStreamListView');
            updatedCameraStreamList.applyFind({'streamname': streamname});

            var result = updatedCameraStreamList.data();

            if(!result || result.length == 0){
                var response = {
                    error: 'there are no existing camera streams'
                };
                winston.log("error", '[evowebservices-sst] find - there are no existing camera streams');
                return camerastream(response);
            }

            return camerastream(result);
        }

    });
};


exports.delete = function (streamname, camerastream) {

    winston.log("info", '[evowebservices-sst] delete camera stream '+streamname); 

    //load the database
    db.loadDatabase({}, function () {

        //get the users collection
        var camerastreams = db.getCollection('camerastreams');

        // winston.log("verbose", "camerastreams " + JSON.stringify(camerastreams));

        if ((typeof(camerastreams) == "undefined") || camerastreams === null ) {
            var response = {
                error: 'there are no existing camera streams'
            };
            winston.log("error", '[evowebservices-sst] find - there are no existing camera streams');
            return camerastream(response);

        } else {


            var deleteCameraStream = camerastreams.findOne({'streamname': streamname});

            winston.log("verbose", "deleteCameraStream " + JSON.stringify(deleteCameraStream));

            if(deleteCameraStream !== null){
                camerastreams.remove(deleteCameraStream);

                //save the database
                db.saveDatabase();

                var deletedStatusResponse = {
                    "status": true,
                    "message": "camera stream deleted - "+streamname
                };
                winston.log("info", '[evowebservices-sst] camera stream deleted - '+streamname);
            }else{
                var deletedStatusResponse = {
                    "status": true,
                    "message": "no camera stream deleted - "+streamname
                };
                winston.log("info", '[evowebservices-sst] camera stream deleted - '+streamname);
            }


            return camerastream(deletedStatusResponse);
            
        }

    });
};



exports.findByLocalIpAndRemove = function (localIp, camerastream) {

    winston.log("info", '[evowebservices-sst] find camera stream');

    //load the database
    db.loadDatabase({}, function () {

        //get the users collection
        var camerastreams = db.getCollection('camerastreams');

        if ((typeof(camerastreams) == "undefined") || camerastreams === null) {
            var response = {
                error: 'there are no existing camera streams'
            };
            winston.log("error", '[evowebservices-sst] find - there are no existing camera streams');
            return camerastream(response);

        } else {

            camerastreams.chain().find({'localIp': localIp}).remove();
            //save the database
            db.saveDatabase();

            var updatedCameraStreamList = camerastreams.addDynamicView('updatedCameraStreamListView');
            var result = updatedCameraStreamList.data();

            if(!result || result.length == 0){
                var response = {
                    error: 'there are no existing camera streams'
                };
                winston.log("error", '[evowebservices-sst] find - there are no existing camera streams');
                return camerastream(response);
            }

            return camerastream(result);
        }

    });
};


exports.showAll = function (result) {
    winston.log("info", '[evowebservices-sst] show all camera stream');

    //load the database
    db.loadDatabase({}, function () {

        //get the users collection
        var camerastreams = db.getCollection('camerastreams');

        if ((typeof(camerastreams) == "undefined") || camerastreams === null) {
            var response = {
                error: 'there are no existing camera streams'
            };
            winston.log("error", '[evowebservices-sst] find - there are no existing camera streams');
            return result(response);

        } else {

            //load the saved camera stream, need to use dynamic
            var updatedCameraStreamList = camerastreams.addDynamicView('updatedCameraStreamListView');

            return result(updatedCameraStreamList.data());

        }

    });
};





