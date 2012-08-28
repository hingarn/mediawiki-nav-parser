/**
 *  Created by Alexey Ivlev on 8/27/12.
 *  Copyright (c) 2012 Alexey Ivlev. All rights reserved.
 */

var express = require('express'),
    http = require('http'),
    jQuery = require('jquery'),
    url = require('url')

var app = express();
app.listen(8000);

app.get('/mediawiki', function(request, response){
    var query = JSON.parse(url.parse(request.url, true).query.q);
    var wikiSlug = query.game_slug;
    var opts = {
        host: 'apis.ign.com',
        path: '/wiki/v1/'+wikiSlug+'/api.php?page=Ign:Navigation&prop=text&action=parse&format=json',
        method: 'GET'
    };
    var result = '';

    var navRequestCallback = function(res){
        res.setEncoding('utf8');

        res.on('data', function(data){
            result += data;
        })

        res.on('end', function(){
            var responseObject = JSON.parse(result);
            var guideNav = responseObject.parse.text["*"];
            var out = [];
            jQuery(guideNav).children("li").each(function() {
                out.push(processOneLi(jQuery(this), wikiSlug));
            });

            response.setHeader("Content-Type", "application/json");
            response.write(JSON.stringify(out));
            response.end();
        });
    }

    var navRequest = http.get(opts, navRequestCallback);
    navRequest.on('error', function(e){
        console.log('error ' + e);
    })
});

var processOneLi = function(node, wikiSlug) {
    var aNode = node.children("a:first");

    var subList = node.children("ul:first");
    if(subList.length > 0) {
        var retVal = {
            "text": aNode.attr("title"),
            "slug": aNode.attr("href").replace('/wiki/v1/'+wikiSlug+'/index.php/', ''),
            "leaf": false,
            "name": aNode.text()
        };

        jQuery(subList).children("li").each(function() {
            if (!retVal.hasOwnProperty("items")) {
                retVal.items = [];
            }
            retVal.items.push(processOneLi(jQuery(this), wikiSlug));
        });
    } else  {
        var retVal = {
            "text": aNode.attr("title"),
            "slug": aNode.attr("href").replace('/wiki/v1/'+wikiSlug+'/index.php/', ''),
            "leaf": true,
            "name": aNode.text()
        };
    }

    return retVal;
}