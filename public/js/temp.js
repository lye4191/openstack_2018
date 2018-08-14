var http = require('http');
var fs = require('fs');
var querystring = require('querystring');

var contents = fs.readFileSync("token.json");
var jsonContent = JSON.parse(contents);
var object = {};

object.data = jsonContent;
jsonheaders = {"Content-Type" : "application/json"};
object.headers = jsonheaders;

var Client = require('node-rest-client').Client;
var client = new Client();

http.createServer(function(req, res){
    if(req.method == 'GET'){
        fs.readFile('test.html', function(err,data){
            res.writeHead(200, {'Content-Type' : 'text/html'});
            res.end(data);
        });

    } else if(req.method == 'POST'){
        req.on('data',function(chunk){
            console.log(chunk.toString());
            var data = querystring.parse(chunk.toString());
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.end(' id: '+data.id + ' pwd: ' + data.pwd);

            /* token.json 바꾸기 */
            jsonContent.auth.identity.password.user.name = data.id;
            jsonContent.auth.identity.password.user.password = data.pwd;

            /* api 보내기 */
            client.registerMethod("postMethod", "http://164.125.70.26:801/identity/v3/auth/tokens", "POST");
            client.registerMethod("jsonMethod", "http://remote.site/rest/json/method", "GET");

            client.methods.postMethod(object, function (data, response) {
                // parsed response body as js object
                // raw response
                var headers = JSON.stringify(response.headers);
                var jsonValue = JSON.parse(headers);
                console.log(jsonValue['x-subject-token']);
            });
           
            
        });
    }
}).listen(8002, function(){
    console.log('server running on 8016. ');
});