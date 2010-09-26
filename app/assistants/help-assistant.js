function HelpAssistant(){
}
HelpAssistant.prototype.setup = function(){
	this.controller.setupWidget(Mojo.Menu.appMenu, FreeRingtones.MenuAttr, FreeRingtones.MenuModel);

	this.controller.listen("helpDownloadRingtones", Mojo.Event.tap, this.helpDownloadRingtones.bindAsEventListener(this));
	this.controller.listen("helpAssignRingtones", Mojo.Event.tap, this.helpAssignRingtones.bindAsEventListener(this));
	this.controller.listen("helpManageRingtones", Mojo.Event.tap, this.helpManageRingtones.bindAsEventListener(this));
	this.controller.listen("helpAssignOther", Mojo.Event.tap, this.helpAssignOther.bindAsEventListener(this));
	this.controller.listen("helpAssignMessaging", Mojo.Event.tap, this.helpAssignMessaging.bindAsEventListener(this));
	this.controller.listen("helpDiagnose", Mojo.Event.tap, this.helpDiagnose.bindAsEventListener(this));
	this.controller.listen("helpPixi", Mojo.Event.tap, this.helpPixi.bindAsEventListener(this));
	this.controller.listen("helpSendToApp", Mojo.Event.tap, this.helpSendToApp.bindAsEventListener(this));
	
	this.controller.listen("helpFAQ", Mojo.Event.tap, this.helpFAQ.bindAsEventListener(this));

	this.controller.get("version").innerHTML = Mojo.Controller.appInfo.version;
	this.controller.get("apptitle").innerHTML = Mojo.Controller.appInfo.title;
	//this.controller.get("appcountry").innerHTML = Mojo.Locale.getCurrentFormatRegion();
	
}
HelpAssistant.prototype.activate = function(event) {
}
HelpAssistant.prototype.deactivate = function(event) {
}
HelpAssistant.prototype.cleanup = function(event) {
	this.controller.stopListening("helpDownloadRingtones", Mojo.Event.tap, this.helpDownloadRingtones.bindAsEventListener(this));
	this.controller.stopListening("helpAssignRingtones", Mojo.Event.tap, this.helpAssignRingtones.bindAsEventListener(this));
	this.controller.stopListening("helpManageRingtones", Mojo.Event.tap, this.helpManageRingtones.bindAsEventListener(this));
	this.controller.stopListening("helpAssignOther", Mojo.Event.tap, this.helpAssignOther.bindAsEventListener(this));
	this.controller.stopListening("helpAssignMessaging", Mojo.Event.tap, this.helpAssignMessaging.bindAsEventListener(this));
	this.controller.stopListening("helpDiagnose", Mojo.Event.tap, this.helpDiagnose.bindAsEventListener(this));
	this.controller.stopListening("helpPixi", Mojo.Event.tap, this.helpPixi.bindAsEventListener(this));
	this.controller.stopListening("helpSendToApp", Mojo.Event.tap, this.helpSendToApp.bindAsEventListener(this));

	this.controller.stopListening("helpFAQ", Mojo.Event.tap, this.helpFAQ.bindAsEventListener(this));
}


//===================================================
//--> First Set
//===================================================
HelpAssistant.prototype.helpAssignRingtones=function(event){
	this.controller.stageController.pushScene("helpdetails", "helpAssignRingtones");
}
HelpAssistant.prototype.helpDownloadRingtones=function(event){
	this.controller.stageController.pushScene("helpdetails", "helpDownloadRingtones");
}
HelpAssistant.prototype.helpManageRingtones=function(event){
	this.controller.stageController.pushScene("helpdetails", "helpManageRingtones");
}
HelpAssistant.prototype.helpAssignOther=function(event){
	this.controller.stageController.pushScene("helpdetails", "helpAssignOther");
}
HelpAssistant.prototype.helpAssignMessaging=function(event){
	this.controller.stageController.pushScene("helpdetails", "helpAssignMessaging");
}
HelpAssistant.prototype.helpFAQ=function(event){
	this.controller.stageController.pushScene("helpdetails", "helpFAQ");
}
HelpAssistant.prototype.helpFuture=function(event){
	this.controller.stageController.pushScene("helpdetails", "helpFuture");
}
HelpAssistant.prototype.helpDiagnose=function(event){
	this.controller.stageController.pushScene("helpdetails", "helpDiagnose");
}
HelpAssistant.prototype.helpPixi=function(event){
	this.controller.stageController.pushScene("helpdetails", "helpPixi");
}
HelpAssistant.prototype.helpSendToApp=function(event){
	this.controller.stageController.pushScene("helpdetails", "helpSendToApp");
}




//===================================================
//--> Second Set
//===================================================
HelpAssistant.prototype.btnHelpContact=function(event){
	if (ckPrefs.ckHelpFAQs){
		this.controller.stageController.pushScene("about");	
	}else{
		this.controller.showAlertDialog({
			preventCancel: true,
			title: $L("Read the FAQs?"),
			message: $L("It looks like you have not read the FAQs. Please read these before contacting me. 99% of all questions are answered there."),
			choices:[
				{label:$L('Ok'), value:"ok", type:'affirmative'}
			]
		});
	}
}
HelpAssistant.prototype.btnHelpSupport=function(event){
	palm.openurl(this, "http://forums.precentral.net/webos-apps-software/248265-music-ringtones-free-official-thread.html");
}
HelpAssistant.prototype.btnHelpWebsite=function(event){
	palm.openurl(this, "http://www.jeharrisonline.com/palm");
}
HelpAssistant.prototype.btnMoreApps=function(event){
	this.controller.stageController.pushScene("MoreApps");
}