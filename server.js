/**
 * Created by Panda on 21.06.2016.
 */
var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    mime = require('mime'),
    socket = require('./server/chat/chat_server.js'),
    cache = {};

var jade = require('jade'),
    options = {pretty: true},
    stylus = require('stylus'),
    chokidar = require('chokidar');



var server = http.createServer(function(req,res){
    var filePath = false;
    if(req.url === '/'){
        filePath = 'server/index.jade';
    }else{
        filePath = 'public' + req.url;
    }
    var absPath = './' + filePath;
    serveStatic(res, cache, absPath);
}).listen(8080, function(){console.log("Listeting port 8080...")});
socket.initialize(server);

chokidar.watch('./public/css/*.stylus', {ignored: /[\/\\]\./})
    .on('add', function(event, path){
        cssCompile(event);
    })
    .on('change', function(event, path){
        cssCompile(event);
    })
    .on('unlink', function(event, path){
        var array = event.split('\\') || event.split('/')
        fs.unlink('./public/css/' + array[array.length - 1].split('.')[0] + '.css', function(err){
            if (err) throw err;
            console.log('Deleted ./public/css/' + array[array.length - 1].split('.')[0] + '.css');
        });
        console.log(event);
    });

function cssCompile(filePath){
    var array = filePath.split('\\') || filePath.split('/');
    stylus(fs.readFileSync(filePath, 'utf8'))
        .render(function(err, css){
            if (err) throw err;
            fs.writeFile('./public/css/' + array[array.length - 1].split('.')[0] + '.css', css, function(err) {
                if(err) {
                    return console.log(err);
                }
                console.log('Added or changed ./public/css/' + array[array.length - 1].split('.')[0] + '.css');
            });
        });
}

function send404(res){
    res.writeHead(404, {"Content-Type": 'text/plain'});
    res.write("Error 404: resource not found");
    res.end();
};

function sendFile(res, filePath, fileContents){
    if(mime.lookup(path.basename(filePath)) == 'text/jade'){
        res.writeHead(200, {'content-type' : 'text/html'});
        res.end(jade.renderFile(filePath, options));
    }
    else if(mime.lookup(path.basename(filePath)) == 'text/jade'){

    }
    else{
        res.writeHead(200, {'content-type' : mime.lookup(path.basename(filePath))});
        res.end(fileContents);
    }

};

function serveStatic(res, cache, absPath){
    if(cache[absPath]){
        sendFile(res, absPath, cache[absPath]);
    }else{
        fs.exists(absPath, function(exists){
            if(exists){
                fs.readFile(absPath, function(err, data){
                    if(err){
                        send404(res);
                    }else{
                        cache[absPath] = data;
                        sendFile(res, absPath, data);
                    }
                });
            }else{
                send404(res);
            }
        })
    }
}