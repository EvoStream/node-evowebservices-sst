/**
 *
 * Copyright (c) 2017, EvoStream Inc.  All rights reserved.
 *
 * This software is provided free of charge to be used solely in conjunction
 * with the EvoStream Media Server.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the source code retain the above
 * copyright notice, this list of conditions and the following disclaimer.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 *
 *
 * @package evostream
 * @subpackage api
 * @version 0.708
 */

/**
 * EMS API
 */

var request = require('request-enhanced');
var winston = require('winston');

module.exports = function(serverUrl) {

    //set the Server URL
    var defaultServerUrl = "http://127.0.0.1:7777/";

    if (serverUrl != null) {
        this.serverUrl = serverUrl;
    } else {
        this.serverUrl = defaultServerUrl;
    }


    //default options
    this.options = {
        url: this.serverUrl,
        method: 'GET',
        headers: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Encoding': 'gzip, deflate'
        },
        pool: {
            maxSockets: Infinity
        },
        maxAttempts: 1,
        maxConcurrent: 100
    };

    var self = this;

    this.buildqs = function(parameters) {

        //Apply Logs
        winston.log("verbose", "EMS API this.buildqs ");

        var qs = "?params=";
        var params = "";

        for (var key in parameters) {
            params += key + "=" + parameters[key] + " ";
        }

        winston.log("verbose", "EMS API parameters: " + params);

        var buffer = new Buffer(params);
        var params64 = buffer.toString('base64');
        qs += params64;

        return qs;

    };


    this.sendCommand = function(command, parameters, callbackResponse) {

        //Apply Logs
        winston.log("verbose", "EMS API this.sendCommand ");

        var queryString = self.buildqs(parameters);

        if (queryString == "?params=") {
            self.options["url"] = self.serverUrl + "/" + command;
        } else {
            self.options["url"] = self.serverUrl + "/" + command + queryString;
        }

        winston.log("verbose", "EMS API this.sendCommand command " + command);
        winston.log("verbose", "EMS API this.sendCommand parameters " + JSON.stringify(parameters));
        winston.log("verbose", "EMS API this.sendCommand url " + self.options["url"]);

        request.get(self.options, function(err, response) {

            if (err) {
                console.log(err);
                winston.log("error", "EMS API this.sendCommand error: "+ err);
                return callbackResponse(err);
            }

            var reponseBody = JSON.parse(response);

            //Apply Logs
            // winston.log("verbose", "response "+response);

            return callbackResponse(reponseBody);

        });
    };

    this.command = {
        version: "version",

        /*********************************************************************************************************************
         * Streams 
         */

        pullStream: "pullStream",
        pushStream: "pushStream",
        createHLSStream: "createHLSStream",
        createHDSStream: "createHDSStream",
        createMSSStream: "createMSSStream",
        createDASHStream: "createDASHStream",
        record: "record",
        transcode: "transcode",
        listStreamsIds: "listStreamsIds",
        getStreamInfo: "getStreamInfo",
        listStreams: "listStreams",
        getStreamsCount: "getStreamsCount",
        shutdownStream: "shutdownStream",
        listConfig: "listConfig",
        removeConfig: "removeConfig",
        getConfigInfo: "getConfigInfo",
        isStreamRunning: "isStreamRunning",

        /*********************************************************************************************************************
         * Aliasing 
         */

        addStreamAlias: "addStreamAlias",
        listStreamAliases: "listStreamAliases",
        removeStreamAlias: "removeStreamAlias",
        flushStreamAliases: "flushStreamAliases",
        addGroupNameAlias: "addGroupNameAlias",
        flushGroupNameAliases: "flushGroupNameAliases",
        getGroupNameByAlias: "getGroupNameByAlias",
        listGroupNameAliases: "listGroupNameAliases",
        removeGroupNameAliases: "removeGroupNameAliases",
        listHttpStreamingSessions: "listHttpStreamingSessions",
        createIngestPoint: "createIngestPoint",
        removeIngestPoint: "removeIngestPoint",
        listIngestPoints: "listIngestPoints",

        /*********************************************************************************************************************
         * Utility and Feature API Functions 
         */

        startWebRTC: "startWebRTC",
        stopWebRTC: "stopWebRTC",
        launchProcess: "launchProcess",
        setTimer: "setTimer",
        listTimers: "listTimers",
        removeTimer: "removeTimer",
        generateLazyPullFile: "generateLazyPullFile",
        generateServerPlaylist: "generateServerPlaylist",
        insertPlaylistItem: "insertPlaylistItem",
        uploadMedia: "uploadMedia",
        getMetadata: "getMetadata",
        pushMetadata: "pushMetadata",
        shutdownMetadata: "shutdownMetadata",
        listStorage: "listStorage",
        addStorage: "addStorage",
        removeStorage: "removeStorage",
        setAuthentication: "setAuthentication",
        setLogLevel: "setLogLevel",
        quit: "quit",
        help: "help",
        shutdownServer: "shutdownServer",

        /*********************************************************************************************************************
         * Connections
         */

        listInboundStreamNames: "listInboundStreamNames",
        listInboundStreams: "listInboundStreams",
        getConnectionInfo: "getConnectionInfo",
        listConnections: "listConnections",
        clientsConnected: "clientsConnected",
        httpClientsConnected: "httpClientsConnected",
        getExtendedConnectionCounters: "getExtendedConnectionCounters",
        resetMaxFdCounters: "resetMaxFdCounters",
        resetTotalFdCounters: "resetTotalFdCounters",
        getConnectionsCount: "getConnectionsCount",
        getConnectionsCountLimit: "getConnectionsCountLimit",
        setConnectionsCountLimit: "setConnectionsCountLimit",
        getBandwidth: "getBandwidth",
        setBandwidthLimit: "setBandwidthLimit",

        /*********************************************************************************************************************
         * Connections
         */

        listServices: "listServices",
        createService: "createService",
        enableService: "enableService",
        shutdownService: "shutdownService",

        /*********************************************************************************************************************
         * Additional Info
         */

        getInboundStreamsCount: "getinboundStreamsCount",
        getLicenseId: "getLicenseId",
        getServerInfo: "getServerInfo"

    }


    for (var key in this.command)(function(key) {
        global[key] = function(parameters, callbackResponse) {

            //Apply Logs
            winston.log("info", "EMS API function command ");

            self.sendCommand(key, parameters, callbackResponse);
        };
    })(key);

    return self;

};