//Example POST method invocation
var Client = require('node-rest-client').Client;
var client = new Client();

var fs = require('fs');
var args = fs.readFileSync("token.json");
 
// set content-type header and data as json in args parameter
var args = {
        data: {
        "auth": {
            "identity": {
                "methods": [
                    "password"
                ],
                "password": {
                    "user": {
                        "name": "admin",
                        "domain": {
                            "name": "Default"
                        },
                        "password": "secret"
                    }
                }
            },
            "scope": {
                "project": {
                    "id": "81256633522d429fa7f6dadcf0800751"
                }
            }
        }
    },
    headers: { "Content-Type": "application/json" }
};

console.log("#####",  typeof args);

//client.post("http://164.125.70.26:801/identity/v3/auth/tokens", args, function (data, response) {
//    // parsed response body as js object
//    console.log(data);
//    // raw response
//    console.log(response);
//});
 
// registering remote methods
client.registerMethod("postMethod", "http://164.125.70.26:801/identity/v3/auth/tokens", "POST");
client.registerMethod("jsonMethod", "http://remote.site/rest/json/method", "GET");

client.methods.postMethod(args, function (data, response) {
    // parsed response body as js object
    //console.log(data);
    // raw response
    var headers = JSON.stringify(response.headers);
    var jsonValue = JSON.parse(headers);
    console.log(jsonValue['x-subject-token']);
});