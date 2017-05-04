/***
 *
 * EvoStream Web Services
 * EvoStream, Inc.
 * (c) 2016 by EvoStream, Inc. (support@evostream.com)
 * Released under the MIT License
 *
 ***/

console.log("[evowebservices-sst] starting evowebservices:server listening on port 4000 ");

var express = require('express');
var router = express.Router();
var request = require('request-enhanced');

var asyncLoop = require('node-async-loop');

var path = require('path');
var jsonComment = require('comment-json');
var fs = require('fs');

var winston = require('winston');
winston.log("info", "[evowebservices-sst] starting evowebservices:server listening on port 4000 ");

//using portable database
var cameraStream = require(path.join(__dirname, '../models/camera-stream'));
var edge = require(path.join(__dirname, '../models/edge'));

router.get('/', function (req, res, next) {

    console.log('index index ');

    var vm = {
        title: 'index EVOSTREAM'
    }

    res.render('index', vm);

});

router.post('/', function (req, res, next) {
    winston.log("info", "[evowebservices-sst] function: Incoming raw post data from EMS");

    //Get the RAW POST DATA
    var event = req.body;
    var eventType = req.body.type;

    winston.log("info", "[evowebservices-sst] event: " + eventType);
    winston.log("info", "[evowebservices-sst] event data: " + JSON.stringify(event));

    var remoteIp = null;

    //Added the remoteIp
    if (event.payload.ip == "") {
        remoteIp = req.ip.split(":").pop();
    } else {
        remoteIp = event.payload.ip;
    }
    event.remoteIp = remoteIp;

    var remoteIp = event.payload.ip;
    event.remoteIp = remoteIp;


    if (eventType == 'inStreamCreated') {

        winston.log("info", '[evowebservices-sst] AzureStreamManager-SST inStreamCreated');
        winston.log("info", '[evowebservices-sst] AzureStreamManager-SST inStreamCreated event data: ' + JSON.stringify(event));

        //calculate port
        var localIp = event.payload.ip;
        var subnet = localIp.split(".");


        // var publicIp = edgeConfig.edge.publicIp;

        //get the publicIp
        edge.find(localIp, function (response) {

            var result = response;

            winston.log("verbose", "result " + JSON.stringify(result));

            if(!result.error ) {
                var publicIp = result.publicIp;

                var portStart = 48410;
                var portUnit = parseInt(subnet[3]) - 5;
                var port = portStart + portUnit;

                winston.log("verbose", "portStart " +portStart );
                winston.log("verbose", "portUnit " +portUnit );
                winston.log("verbose", "parseInt(subnet[3]) " +parseInt(subnet[3]) );
                winston.log("verbose", "port " +port );

                var data = {
                    "streamname": event.payload.name,
                    "publicIp": publicIp,
                    "localIp": event.payload.nearIp,
                    "port": port
                };

                winston.log("verbose", "data " + JSON.stringify(data));

                //Store the camera stream
                cameraStream.create(data, function (response) {

                    winston.log("verbose", "camera stream created response" + JSON.stringify(response));

                    if (typeof response[0] !== "undefined") {
                        winston.log("verbose", '[evowebservices-sst] camera stream added - data ' + JSON.stringify(data));
                    } else {

                        winston.log("error", '[evowebservices-sst] camera stream not added - data ' + JSON.stringify(data));

                    }
                });
            }
        });
    }

    if (eventType == 'inStreamClosed') {

        var streamname = event.payload.name;

        cameraStream.delete(streamname, function (response) {

            winston.log("verbose", "remove-stream - response  " + JSON.stringify(response));

            var result = response;

            res.json(result);

        });

    }

    if (eventType == 'vmCreated') {

        winston.log("info", '[evowebservices-sst] AzureStreamManager-SST vmCreated');
        winston.log("info", '[evowebservices-sst] AzureStreamManager-SST vmCreated event ' + JSON.stringify(event));

        var serverObjectPort = '8888';
        var serverObjectUserName = 'evostream';
        var localIp = event.localIp;

        var data = {
            "publicIp": event.publicIp,
            "apiproxy": event.payload.apiproxy,
            "username": serverObjectUserName,
            "password": event.payload.password,
            "port": serverObjectPort
        };

        winston.log("info", '[evowebservices-sst] AzureStreamManager-SST vmCreated data ' + JSON.stringify(data));

        edge.create(localIp, data, function (response) {

            var result = response;

            winston.log("verbose", "[evowebservices-sst] edge inserted: " + JSON.stringify(result));

        })


    }

    if (eventType == 'serverStarted') {

        winston.log("info", '[evowebservices-sst] AzureStreamManager-SST serverStarted');
        winston.log("info", '[evowebservices-sst] AzureStreamManager-SST serverStarted data ' + JSON.stringify(event));

        var localIp = event.localIp;

        edge.find(localIp, function (response) {

            var result = response;

            if(!result.error){

                //build the api proxy url
                var serverObject = {
                    "localIp": localIp,
                    "apiproxy": result.apiproxy,
                    "username": result.username,
                    "password": result.password,
                    "port": result.port
                };

                var publicIp = result.publicIp;


                var apiProxyUrl = getUrlApiProxy(serverObject);
                winston.log("verbose", "api proxy url: " +apiProxyUrl );

                if(apiProxyUrl != ''){

                    var ems = require("../core_modules/ems-api-core")(apiProxyUrl);
                    var parameters = null;

                    ems.listStreams(parameters, function (result) {

                        winston.log("verbose", "[evowebservices-sst] AzureStreamManager-SST listStreams result: " + JSON.stringify(result));

                        if (result.status == "FAIL" || (result.data == null )) {
                            winston.log("error", "[evowebservices-sst] AzureStreamManager-SST listStreams failed result: " + JSON.stringify(result));
                        } else {

                            var listStreamData = result.data;

                            //loop to the liststreamdata
                            asyncLoop(listStreamData, function (stream, next)
                            {

                                if(stream.type == 'INR'){

                                    cameraStream.find(stream.name, function (response) {

                                        if (typeof response ['error'] !== "undefined") {
                                            winston.log("error", '[evowebservices-sst] camera stream not added - data ' + JSON.stringify(data));
                                            next();
                                        }

                                        if (response.length < 1) {

                                            winston.log("verbose", "store this cameraStream " + JSON.stringify(response));

                                            //calculate port
                                            var localIp = stream.nearIp;
                                            var subnet = localIp.split(".");

                                            var portStart = 48410;
                                            var portUnit = 5 - parseInt(subnet[3]);
                                            var port = portStart + portUnit;

                                            winston.log("verbose", "portStart " +portStart );
                                            winston.log("verbose", "portUnit " +portUnit );
                                            winston.log("verbose", "parseInt(subnet[3]) " +parseInt(subnet[3]) );
                                            winston.log("verbose", "port " +port );

                                            var data = {
                                                "streamname": stream.name,
                                                "publicIp" : publicIp,
                                                "localIp" : stream.nearIp,
                                                "port": port
                                            };

                                            //Store the camera stream
                                            cameraStream.create(data, function (response) {

                                                if (typeof response[0] !== "undefined") {
                                                    winston.log("verbose", '[evowebservices-sst] camera stream added - data ' + JSON.stringify(data));
                                                } else {

                                                    winston.log("error", '[evowebservices-sst] camera stream not added - data ' + JSON.stringify(data));

                                                }

                                                next();

                                            });
                                        }else{
                                            next();
                                        }
                                    })
                                }else{
                                    next();
                                }
                            }, function ()
                            {
                                winston.log("verbose", "Checking of listStreams for "+localIp+" finished");
                            });

                        }
                    });
                }

                res.json(true);

            }

        })

    }

    if (eventType == 'serverStopping') {

        var localIp = event.localIp;
        var url = req.protocol + "://" + req.get('host') + "/evostream/remove?localip="+localIp;

        request.get(url, function(err, response) {

            winston.log("verbose", "serverStopping - edge deletion response: " + JSON.stringify(response));

        });

    }


});


router.get('/live', function (req, res, next) {

    var streamname = req.query.streamname;

    cameraStream.find(streamname, function (response) {

        winston.log("verbose", "camera stream found: " + JSON.stringify(response));

        var result = response;

        if ((typeof(response) == "undefined") || response.length == 0) {
            result = {
                error: 'there are no existing camera streams'
            };
            winston.log("error", '[evowebservices-sst] find - there are no existing camera streams');

        }

        if (typeof response ['error'] !== "undefined") {
            result = {
                error: 'there are no existing camera streams'
            };
            winston.log("error", '[evowebservices-sst] find - there are no existing camera streams');
        }

        if(response.length > 0){
            delete result[0]["meta"];
            delete result[0]["$loki"];
        }

        res.json(result);

    });

});

router.get('/remove', function (req, res, next) {

    var localIp = req.query.localip;

    //find localIp on the edge configuration
    cameraStream.findByLocalIpAndRemove(localIp, function (response) {

        var cameraStreamData = response;
        var deletedStatusResponse = null;

        if(!cameraStreamData.error){
            //remove localIp from the Edge Configuration
            edge.findByLocalIpAndRemove(localIp, function (response) {

                var edgeData = response;

                if(!edgeData.error){
                    deletedStatusResponse = {
                        "status": true,
                        "message": "edge and camera streams linked are deleted"
                    };
                }else{
                    deletedStatusResponse = {
                        error: 'there are no existing camera streams'
                    };
                }

                res.json(deletedStatusResponse);
            });
        }else{
            deletedStatusResponse = {
                error: 'there are no existing camera streams'
            };

            res.json(deletedStatusResponse);
        }
    });
});



router.get('/show-all', function (req, res, next) {

    cameraStream.showAll(function (response) {

        var result = response;

        winston.log("verbose", "[evowebservices-sst] show all camera stream: " + JSON.stringify(response));

        if (response.length == 0) {
            result = {
                error: 'there are no existing camera streams'
            };
            winston.log("error", '[evowebservices-sst] show all - there are no existing camera streams');
        }

        if (typeof response ['error'] !== "undefined") {
            result = {
                error: 'there are no existing camera streams'
            };
            winston.log("error", '[evowebservices-sst] show all - there are no existing camera streams');
        }

        for (var index in result) {

            winston.log("verbose", "result[index] " + JSON.stringify(result[index]));

            delete result[index]["meta"];
            delete result[index]["$loki"];
        }

        res.json(result);

    })

});


/*
 FOR TESTING
 */


router.get('/remove-testing', function (req, res, next) {

    var eventType = "serverStopping";

    winston.log("verbose", "eventType " +eventType );

    if (eventType == 'serverStopping') {

        winston.log("verbose", "inside eventType " +eventType );

        // var localIp = event.localIp;
        var localIp = "10.10.0.5";

        // var fullUrl = req.protocol + '://' + req.get('host') + '/fbcallback';
        var url = req.protocol + "://" + req.get('host') + "/evostream/remove?localip="+localIp;

        winston.log("verbose", "url " +url );

        request.get(url, function(err, response) {

            res.json(response);


        });

    }
});



router.get('/remove-stream', function (req, res, next) {

    // var name = req.body.name;
    //
    // console.log('name '+name );

    winston.log("verbose", "remove-stream remove-stream remove-stream remove-stream remove-stream  " );

    var streamname = 'mystream01-01';

    cameraStream.delete(streamname, function (response) {

        winston.log("verbose", "remove-stream - response  " + JSON.stringify(response));

        var result = response;

        res.json(result);

    });

});


// router.get('/create-edge', function (req, res, next) {
//
//     // var name = req.body.name;
//     //
//     // console.log('name '+name );
//
//     var localIp = "10.10.0.5";
//
//     var data = {
//         "publicIp": "13.94.41.184",
//         "apiproxy": "apiproxy",
//         "username": "evostream",
//         "password": "Pa$$word",
//         "port": "8888"
//     };
//
//
//     edge.create(localIp, data, function (response) {
//
//         var result = response;
//
//         res.json(result);
//
//     })
//
// });


// router.get('/update-camerastreamlist', function (req, res, next) {
//
//
//     //Get the edge information
//    
//
//     var localIp = "10.10.0.6";
//
//     var data = {
//         "publicIp": "13.94.41.184",
//         "apiproxy": "apiproxy",
//         "username": "evostream",
//         "password": "Pa$$word",
//         "port": "8888"
//     };
//
//
//     edge.find(localIp, function (response) {
//
//         var result = response;
//
//         // res.json(result);
//
//         if(!result.error){
//
//             //build the api proxy url
//             var serverObject = {
//                 "localIp": localIp,
//                 "apiproxy": result.apiproxy,
//                 "username": result.username,
//                 "password": result.password,
//                 "port": result.port
//             };
//
//             var publicIp = result.publicIp;
//
//
//             var apiProxyUrl = getUrlApiProxy(serverObject);
//
//             winston.log("verbose", "apiProxyUrl " +apiProxyUrl );
//
//             if(apiProxyUrl != ''){
//
//                 var ems = require("../core_modules/ems-api-core")(apiProxyUrl);
//                 var parameters = null;
//
//                 ems.listStreams(parameters, function (result) {
//
//                     winston.log("verbose", "[evowebservices-sst] AzureStreamManager-SST listConfig result: " + JSON.stringify(result));
//
//                     if (result.status == "FAIL" || (result.data == null )) {
//                         winston.log("error", "[evowebservices-sst] AzureStreamManager-SST listConfig failed result: " + JSON.stringify(result));
//                     } else {
//
//                         var listStreamData = result.data;
//
//                         //loop to the liststreamdata
//                         asyncLoop(listStreamData, function (stream, next)
//                         {
//                             winston.log("verbose", "stream " + JSON.stringify(stream));
//                             // var publicIp = edge.getPublicIp();
//
//                             winston.log("verbose", "publicIp " + publicIp);
//
//                             if(stream.type == 'INR'){
//
//                                 cameraStream.find(stream.name, function (response) {
//
//                                     winston.log("verbose", "find cameraStream response " + JSON.stringify(response));
//
//                                     if (typeof response ['error'] !== "undefined") {
//                                         winston.log("error", '[evowebservices-sst] camera stream not added - data ' + JSON.stringify(data));
//
//                                         next();
//                                     }
//
//                                     winston.log("verbose", "find cameraStream response response.length " +response.length);
//
//                                     if (response.length < 1) {
//
//                                         winston.log("verbose", "store this cameraStream " + JSON.stringify(response));
//
//                                         //calculate port
//                                         var localIp = stream.nearIp;
//                                         var subnet = localIp.split(".");
//
//                                         var portStart = 48410;
//                                         var portUnit = 5 - parseInt(subnet[3]);
//
//                                         winston.log("verbose", "portUnit " + portUnit);
//
//
//                                         winston.log("verbose", "edgeConfig " + JSON.stringify(edgeConfig));
//
//                                         var port = portStart + portUnit;
//
//                                         winston.log("verbose", "publicIp " + publicIp);
//
//                                         var data = {
//                                             "streamname": stream.name,
//                                             "publicIp" : publicIp,
//                                             "localIp" : stream.nearIp,
//                                             "port": port
//                                         };
//
//                                         //Store the camera stream
//                                         cameraStream.create(data, function (response) {
//
//                                             winston.log("verbose", "create cameraStream response " + JSON.stringify(response));
//
//                                             if (typeof response[0] !== "undefined") {
//                                                 winston.log("verbose", '[evowebservices-sst] camera stream added - data ' + JSON.stringify(data));
//                                             } else {
//
//                                                 winston.log("error", '[evowebservices-sst] camera stream not added - data ' + JSON.stringify(data));
//
//                                             }
//
//                                             next();
//
//                                         });
//                                     }else{
//                                         next();
//                                     }
//
//
//                                 })
//                             }else{
//                                 next();
//                             }
//                         }, function ()
//                         {
//                             winston.log("verbose", "Checking of listStreams for "+localIp+" finished");
//                         });
//
//                     }
//                 });
//             }
//
//             res.json(true);
//
//         }
//
//     })
//
// });

var getUrlApiProxy = function (serverObject) {

    winston.log("info", "[evowebservices] function: AzureStreamManager building api proxy");

    var url = '';
    url = 'http://' + serverObject['username'] + ':' + serverObject['password'] + '@' + serverObject['localIp'] + ':' + serverObject['port'] + '/' + serverObject['apiproxy'];

    return url;

}

module.exports = router;