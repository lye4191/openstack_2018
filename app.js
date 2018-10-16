/* module */
var fs = require('fs')
,express = require('express')
,bodyParser = require('body-parser');
const path = require('path');

/* REST API (POST) 사용 */
var app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static('public'));
app.set('view engine', 'pug'); 
app.set('views', path.join(__dirname, 'views')); 

/* json 파일 object 파일로 변환 */
var contents = fs.readFileSync("json/token.json");
var heatContent = fs.readFileSync("json/template.json");
var jsonContent = JSON.parse(contents);
var heatJsonContent = JSON.parse(heatContent);
var object = {};
var heatObject = {};
var host = "164.125.70.13"; 

object.data = jsonContent;
heatObject.data = heatJsonContent;
jsonheaders = {"Content-Type" : "application/json"};
object.headers = jsonheaders;

/* api */
var Client = require('node-rest-client').Client;
var client = new Client();

var countNum = 0;
var led = false;
var cool = false;
var jodo = 25;
/* 메인 페이지 */
app.get('/', function(req, res){
fs.readFile('index.html', function(err,data){
    res.writeHead(200, {"Content-Type" : "text/html"});
    res.end(data);
});
})

app.get('/select', function(req, res){
fs.readFile('select.html', function(err,data){
    res.writeHead(200, {"Content-Type" : "text/html"});
    res.end(data);
});
})

/* 로그인 */
app.post('/select', function(req, res, next){
//console.log(req.body);
var id = req.body.id;
var pwd = req.body.pwd;

/* token.json 바꾸기 */
jsonContent.auth.identity.password.user.name = id;
jsonContent.auth.identity.password.user.password = pwd;

/* api 보내기 */
client.registerMethod("postMethod", "http://164.125.70.13/identity/v3/auth/tokens", "POST");
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
});
res.redirect('/select');
});

app.get('/select/nonfunc', function(req, res){

fs.readFile('nonfunctional.html', function(err, data){
    res.writeHead(200, {"Content-Type" : "text/html"});
    res.end(data);
});
});

app.post('/select/nonfunc', function(req, res, next){
// 총 기기 수
//var countNum = 0;
console.log(req.body);
var funcContent = JSON.parse(JSON.stringify(req.body));
countNum = countMachine(funcContent);


//function select
res.redirect('/select/nonfunc');
//res.render('selectspeed', {name : req.body.machineName , nameq : req.body.systemName});

});

app.get('/select/nonfunc/createstack', function(req, res){
fs.readFile('createstack.pug', function(err,data){
    res.writeHead(200, {"Content-Type" : "text/html"});
    res.end(data);
});


});

app.post('/select/nonfunc/createstack', function(req, res, next){

console.log(req.body);

/* Disk, RAM, vCPU 순서대로 */ 
var weight = new Array();
var image="ee0f4e83-7aaa-46cb-898a-c2a074290947";
var nonfuncContent = JSON.parse(JSON.stringify(req.body));
weight = DistinctResource(nonfuncContent, countNum);

heatJsonContent.stack_name = req.body.fullname;

heatJsonContent.template.parameters.disks.default = weight[0];
heatJsonContent.template.parameters.rams.default = weight[1]*1024;
heatJsonContent.template.parameters.vcpu.default = weight[2];
heatObject.data = heatJsonContent;

var getToken = fs.readFileSync("token.txt", 'utf8');
var token = JSON.stringify(getToken);
var heatHeaders = {"Content-Type" : "application/json",
                  "X-Auth-Token" :getToken};
heatObject.headers = heatHeaders;
client.post("http://164.125.70.13/heat-api/v1/36b011806ff042dba0a3b90e6e639ea2/stacks", heatObject, function(data, response) {
    console.log(data);
    res.redirect('http://' + host + '/dashboard/project/stacks/');
});

console.log("#####", heatObject);

var systemJson = req.body.systemName;
var machineJson = req.body.machineName;
var bmesJson = req.body.bmesName;
var outsideJson = req.body.outsideName;

// res.render('createstack', {name : req.body.systemName, nameq : req.body.machineName});
});

app.get('/machinelist', function(req, res){
fs.readFile('machinelist.pug', function(err,data){
    res.writeHead(200, {"Content-Type" : "text/html"});
    res.end(data);
});

});

app.post('/machinelist', function(req, res, next){
    var sendData = {};
    sendData.headers = {"Content-Type" : "application/json"};
    var parsingData = JSON.parse(JSON.stringify(req.body));
    console.log(res.body);

    if(parsingData.LED) {
        if(led) led = false;
        else led = true;
        parsingData.LED = led;
    }
    if(parsingData.COOL){
        if(cool) cool = false;
        else cool = true;

        parsingData.COOL = cool;
    }
    
    if(parsingData.jodo != undefined){
        console.log("!@#!#@#!#");
        client.get("http://localhost:3000/jodo", function(req, res){
           // var parsing = JSON.parse(JSON.stringify(req));
            console.log(req);
            //jodo = parseInt(parsing.jodo,10);
            //console.log("jodo parsing : " , req.jodo);
            jodo = req;
        });
    }
    else{
        sendData.headers = {"Content-Type" : "application/json"};
        sendData.data = parsingData;
        console.log(sendData);
        
        client.post("http://localhost:3000/Ctrlmachine", sendData, function(data, response) {
         console.log("sendData!!!");
        });
        
        parseLED = undefined;
        parseCOOL = undefined;
    }
// res.redirect('/machinelist');
    res.render('machinelist',{ledvalue : led, coolvalue : cool, jodovalue : jodo});

});

app.listen(3018, function(){
console.log('Server start.');
});

app.all('*', function(req, res) {
res.status(404).send('<h1>ERROR - 페이지를 찾을 수 없습니다.</h1>');
});


function countMachine(data){

    var machineJson = data.machineName;
    var outsideJson = data.outsideName;
    var Count=0;

    for(var i=0; i<machineJson.length; i++){
        Count += parseInt(machineJson[i],10);
    }
    for(var j=0; j<outsideJson.length; j++){
        Count += parseInt(outsideJson[j],10);
    }

    console.log("count!!!" , Count);
    return Count;

}


function DistinctResource(data, count){

    var speed = data.speedName;
    var peoplenum = parseInt(data.peopleNum);
    var weight = new Array();

    // 응답 속도 중요도
    if(speed == "LOW") {
        weight = [1, 3, 3];
    }
    else if(speed == "MIDDLE"){
        weight = [2, 6, 6];
    }
    else {
        weight = [3, 9, 9];
    }

    // VM 접근 인원
    if((1<=peoplenum) && (peoplenum <= 10)){
        weight[0] += 2;
        weight[1] += 1;
        weight[2] += 1;
    }
    else if((11<=peoplenum) && (peoplenum <= 30)){
        weight[0] += 4;
        weight[1] += 2;
        weight[2] += 2;
    }
    else if((31<=peoplenum) && (peoplenum <= 60)){
        weight[0] += 6;
        weight[1] += 3;
        weight[2] += 3;
    }
    else if((61<=peoplenum) && (peoplenum <= 80)){
        weight[0] += 8;
        weight[1] += 4;
        weight[2] += 4;
    }
    else if((81<=peoplenum) && (peoplenum <= 100)){
        weight[0] += 10;
        weight[1] += 5;
        weight[2] += 5;
    }

    //총 기기수
    if((1<=count) && (count <= 10)){
        weight[0] += 2;
        weight[1] += 1;
        weight[2] += 1;
    }
    else if((11<=count) && (count <= 20)){
        weight[0] += 4;
        weight[1] += 2;
        weight[2] += 2;
    }
    else if((21<=count) && (count <= 30)){
        weight[0] += 6;
        weight[1] += 3;
        weight[2] += 3;
    }
    else if((31<=count) && (count <= 40)){
        weight[0] += 8;
        weight[1] += 4;
        weight[2] += 4;
    }
    else if((41<=count) && (count <= 50)){
        weight[0] += 10;
        weight[1] += 5;
        weight[2] += 5;
    }


    console.log("function in : ", weight);
    return weight;

}