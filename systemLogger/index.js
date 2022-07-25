const fs = require('fs');
const moment = require('moment');
const loki = require('lokijs');
const path = require('path');
module.exports = function systemLogger(mod) {
	var db = new loki(path.join(__dirname, 'terausers.json'), {
		autoload: true,
		autoloadCallback : databaseInitialize,
		autosave: true, 
		autosaveInterval: 10000
	});
	var users=null;
	// implement the autoloadback referenced in loki constructor
	function databaseInitialize() {
		users = db.getCollection("users");
	  if (users === null) {
		users = db.addCollection("users");
	  }
	}
	var logSystem=fs.createWriteStream('system.log', {
		flags: 'a'
	});
	var chatLog=fs.createWriteStream('chat.log', {
		flags: 'a'
	});
	var combatLog=fs.createWriteStream('combat.log', {
		flags: 'a'
	});
	mod.hook('S_SYSTEM_MESSAGE', 1, event => {
		writeLine(event.message,logSystem);
	});
	mod.hook('S_CHAT', 3, event => {
		writeLine(`${event.channel}|${event.name}|${event.message}`,chatLog);
	});
	mod.hook('S_WHISPER', 3, event => {
		writeLine(`whisper ${event.recipient}|${event.name}|${event.message}`,chatLog);
	});
	mod.hook('S_USER_DEATH', 1, event => {
		console.log('S_USER_DEATH');
		let killed = users.findOne({ name:event.name });
		let killer = users.findOne({ name:event.killer });
		if(!killed){
			killed={
				guildName:'undefined',
				templateId:0
			};
		}
		if(!killer){
			killer={
				guildName:'undefined',
				templateId:0
			};
		}
		writeLine(`${event.killed}|${event.name}|${killed.guildName}|${killed.templateId}|${event.killer}|${killer.guildName}|${killer.templateId}`,combatLog);
	});
	mod.hook('S_SPAWN_USER', 15, event => {
		var obj={
			name:event.name,
			templateId:event.templateId,
			guildName:event.guildName,
			gm:event.gm,
			guildRank:event.guildRank, 
			level:event.level,
			playerId:event.playerId
		}
		var us=users.findOne({ name:obj.name });
		if(us===null){
			users.insert(obj);
		}else{
			Object.assign(us, obj); 
			users.update(us);
		}
		
	});
	function writeLine(text,log){
		var date=moment().format('YYYY-MM-DD HH:mm:ss');
		log.write(`${date}|${text}\n`);
	}
}
