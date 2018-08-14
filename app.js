/* module */
var fs = require('fs')
    ,express = require('express')
    ,bodyParser = require('body-parser');

/* REST API (POST) 사용 */
var app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static('public'));


/* json 파일 object 파일로 변환 */
var contents = fs.readFileSync("json/token.json");
var heatContent = fs.readFileSync("json/template.json");
var jsonContent = JSON.parse(contents);
var heatJsonContent = JSON.parse(heatContent);
var object = {};
var heatObject = {};

object.data = jsonContent;
heatObject.data = heatJsonContent;
jsonheaders = {"Content-Type" : "application/json"};
object.headers = jsonheaders;

/* api */
var Client = require('node-rest-client').Client;
var client = new Client();

//var auth = true;

/* 메인 페이지 */
app.get('/', function(req, res){
    fs.readFile('index.html', function(err,data){
        res.writeHead(200, {"Content-Type" : "text/html"});
        res.end(data);
    });

})

/*  */
app.get('/select', function(req, res){
    fs.readFile('select.html', function(err,data){
        res.writeHead(200, {"Content-Type" : "text/html"});
        res.end(data);
    });

})

/* 로그인 */
app.post('/select', function(req, res, next){
    console.log(req.body);
    var id = req.body.id;
    var pwd = req.body.pwd;

    /* token.json 바꾸기 */
    jsonContent.auth.identity.password.user.name = id;
    jsonContent.auth.identity.password.user.password = pwd;

    /* api 보내기 */
    client.registerMethod("postMethod", "http://164.125.70.26:801/identity/v3/auth/tokens", "POST");
    client.registerMethod("jsonMethod", "http://remote.site/rest/json/method", "GET");
    
    client.methods.postMethod(object, function (data, response) {
        // parsed response body as js object
        // raw response
        var headers = JSON.stringify(response.headers);
        var jsonValue = JSON.parse(headers);
        console.log("--------------- token value ---------------\n", jsonValue['x-subject-token']);

        var stream = fs.createWriteStream("token.txt");
        stream.once('open', function(fd){
            stream.write(jsonValue['x-subject-token']);
            stream.end();
        });
        // token 인증
       // if(jsonValue['x-subject-token'] == undefined ) auth = false;
    });

    //res.writeHead(200, {"Content-Type": "text/html"});
    //res.end(' id: '+ id + ' pwd: ' + pwd);
    //console.log("auth = ", auth);
    res.redirect('/select');
   
    /*
    fs.readFile('main.html', function(err,data){
        res.writeHead(200, {'Content-Type' : 'text/html'});
        res.end(data);
    });
    */

});

app.get('/select/createstack', function(req, res){

    fs.readFile('createstack.html', function(err,data){
        res.writeHead(200, {"Content-Type" : "text/html"});
        res.end(data);
    });


});

app.post('/select/createstack', function(req, res, next){

    heatJsonContent.stack_name = req.body.stackname;
    heatJsonContent.parameters.flavor = req.body.flavor;
    heatJsonContent.template.resources.hello_world.properties.image = req.body.image;
    heatObject.data = heatJsonContent;

    var getToken = fs.readFileSync("token.txt", 'utf8');
    var token = JSON.stringify(getToken);
    var heatHeaders = {"Content-Type" : "application/json",
                      "X-Auth-Token" :getToken};
    heatObject.headers = heatHeaders;
    client.post("http://164.125.70.26:801/heat-api/v1/48a1d38373a14cb9b89a6ddcea0ffc0f/stacks", heatObject, function(data, response) {
        console.log("CompleteCreateStack!");
    });

    res.redirect('/select/createstack');
});

app.listen(3384, function(){
    console.log('Server start.');
});

app.all('*', function(req, res) {
	res.status(404).send('<h1>ERROR - 페이지를 찾을 수 없습니다.</h1>');
});
