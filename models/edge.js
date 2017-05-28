var path = require('path');
var loki = require('lokijs');

var winston = require('winston');

// var db = new loki(path.join(__dirname, '../data/edge.json'));

var db = new loki(path.join(__dirname, '../data/edge.json'),
    {
        autoload: true
    });

/*
 * Create Edge
 */
exports.create = function (localIp, edge, next) {
    winston.log("info", '[evowebservices-sst] add edge');

    var localIpFound = false;
    var tempEdgeList = null;

        //load the database
    db.loadDatabase({}, function () {

        var edges = null;

        //get the users collection
        edges = db.getCollection('edge');

        if ((typeof(edges) == "undefined") || edges == null) {

            //add the camerastreams collection if it does not exist
            edges = db.addCollection('edge');

        } else {
            

            var edgeList = edges.addDynamicView('edgeListView');
            edgeList.applyFind({"localIps": { '$contains' : localIp }});

            if(edgeList.data().length > 0){
                return next(edgeList.data());
            }

        }

        winston.log("verbose", "[evowebservices-sst] inserting edge - " + JSON.stringify(edge));

        //add the localIp
        edge.localIps = [];
        var edgeList = edges.addDynamicView('edgeListView');
        var tempEdgeList = edgeList.data();

        winston.log("verbose", "tempEdgeList " + JSON.stringify(tempEdgeList));

        if(tempEdgeList.length > 0){
            if(tempEdgeList[0].localIps.length > 0){
                tempEdgeList[0].localIps.push(localIp);
                edges.update(tempEdgeList[0]);
            }
        }else{
            edge.localIps.push(localIp);
            edges.insert(edge);
        }

        //save the database
        db.saveDatabase();

        return next(edgeList.data());
    });

};

exports.find = function (localIp, edge) {
    winston.log("info", '[evowebservices-sst] find edges');

    //load the database
    db.loadDatabase({}, function () {

        //get the users collection
        var edges = db.getCollection('edge');

        if ((typeof(edges) == "undefined") || edges === null) {
            var response = {
                error: 'there are no existing edges'
            };
            winston.log("error", '[evowebservices-sst] find - there are no existing edges');
            return edge(response);

        } else {
            var result = edges.findOne({"localIps": { '$contains' : localIp }});

            if(!result || result.length == 0){
                var response = {
                    error: 'there are no existing camera streams'
                };
                winston.log("error", '[evowebservices-sst] find - there are no existing edges');
                return edge(response);
            }

            return edge(result);
        }

    });
};


exports.findByLocalIpAndRemove = function (localIp, edge) {
    winston.log("info", '[evowebservices-sst] find edge by localIp and Remove');

    //load the database
    db.loadDatabase({}, function () {

        //get the users collection
        var edges = db.getCollection('edge');

        if ((typeof(edges) == "undefined") || edges == null) {
            var response = {
                error: 'there are no existing edges'
            };
            winston.log("error", '[evowebservices-sst] find - there are no existing edges');
            return edge(response);

        } else {
            var result = edges.findOne({"localIps": { '$contains' : localIp }});

            if(result != null){
                if(result.localIps.length > 0){

                    for(var i = result.localIps.length - 1; i >= 0; i--) {

                        winston.log("verbose", "result.localIps[i] " +result.localIps[i] );

                        if(result.localIps[i] === localIp) {
                            result.localIps.splice(i, 1);
                        }
                    }

                    edges.update(result);
                }
                
                db.saveDatabase();

                var response = {
                    "status": true,
                    "message": "the edge is successfully deleted"

                };
                return edge(response);

            }else{
                var response = {
                    error: 'there are no existing edges'
                };
                winston.log("error", '[evowebservices-sst] find - there are no existing edges');
                return edge(response);
            }

            return edge(result);
        }

    });
};


exports.getPublicIp = function () {

    winston.log("info", '[evowebservices-sst] find camera stream');

    //load the database
    db.loadDatabase({}, function () {

        //get the users collection
        var edges = db.getCollection('edge');

        if ((typeof(edges) == "undefined") || edges == null) {
            var response = {
                error: 'there are no existing edges'
            };
            winston.log("error", '[evowebservices-sst] find - there are no existing edges');
            return response;

        } else {
            var edgeData = edges.addDynamicView('edgeDataView');

            if(!result || result.length == 0){
                var response = {
                    error: 'there are no existing camera streams'
                };
                winston.log("error", '[evowebservices-sst] find - there are no existing edges');
                return response;
            }

            return edgeData.data();
        }

    });

};


