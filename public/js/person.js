var Person = function (name) {
	this.name = name;
	this.hello = function(){
		return "Hello, My name is " + this.name + "!";
	}
}



var saltfactory = new Person('yuni');
console.log(saltfactory.hello());
