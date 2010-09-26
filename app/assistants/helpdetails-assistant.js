function HelpdetailsAssistant(vDiv){
	this.helpSection = vDiv
}
HelpdetailsAssistant.prototype.setup = function(){
	//--> Launch the default App Menu
	this.controller.setupWidget(Mojo.Menu.appMenu, FreeRingtones.MenuAttr, FreeRingtones.MenuModel);

	this.helpObject = this.controller.get(this.helpSection);
	this.helpObject.style.display = "";
	this.helpTitle = this.helpObject.title;
	this.controller.get("title").innerHTML = this.helpTitle;

	
	//===================================================================
	//--> Setup loading spinner
	this.controller.setupWidget('loadSpinner',
		this.attributes = {
			spinnerSize: 'large'
		}, this.model = {
			spinning: false
		}
	);

	try{
		if (this.helpSection == "helpManageRingtones" || this.helpSection == "helpFAQs"){
			//--> Work on our bottom menu
			this.commandMenuModel = {
				items: [
					{},
					{
						command:		'sounds',
						label:			"Manage Sounds & Ringtones"
					},
					{}
				]
			};
			this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'my-scene-fade-bottom'}, this.commandMenuModel);
			
			this.controller.get("myscenefadebottom").style.display = "none";
		}else if (this.helpSection == "helpAssignOther"){
			//--> Work on our bottom menu
			this.commandMenuModel = {
				items: [
					{},
					{
						command:		'clock',
						label:			"Clock & Alarms"
					},
					{
						command:		'calendar',
						label:			"Calendar"
					},
					{}
				]
			};
			this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'my-scene-fade-bottom'}, this.commandMenuModel);
			
			//this.controller.get("myscenefadebottom").style.display = "none";
			//this.controller.get("myscenefadebottom").xMojoScrollFade = "no-fade";
			//this.updateInfo("myscenefadebottom = " + this.controller.get("myscenefadebottom").style.display)
			
		}else if (this.helpSection == "helpAssignMessaging"){
			//--> Work on our bottom menu
			this.commandMenuModel = {
				items: [
					{},
					{
						command:		'messaging',
						label:			"Messaging"
					},
					{
						command:		'email',
						label:			"Email"
					},
					{}
				]
			};
			this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'my-scene-fade-bottom'}, this.commandMenuModel);
			
			this.controller.get("myscenefadebottom").style.display = "none";
		}else if (this.helpSection == "helpAssignRingtones"){
			//--> Work on our bottom menu
			this.commandMenuModel = {
				items: [
					{},
					{
						command:		'contacts',
						label:			"Launch Contacts"
					},
					{}
				]
			};
			this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'my-scene-fade-bottom'}, this.commandMenuModel);
			
			this.controller.get("myscenefadebottom").style.display = "none";
		}else if (this.helpSection == "helpDonate"){
			//--> Work on our bottom menu
			this.commandMenuModel = {
				items: [
					{},
					{
						command:		'jamesapps',
						label:			"James' Apps"
					},
					{
						command:		'appcatalog',
						label:			"App Catalog"
					},
					{}
				]
			};
			this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'my-scene-fade-bottom'}, this.commandMenuModel);
			
			this.controller.get("myscenefadebottom").style.display = "none";
		}else if (this.helpSection == "helpFAQ"){
			//--> Ensures they read the FAQs
			ckPrefs.ckHelpFAQs = true;
			preferences.save(FreeRingtones.Cookie, ckPrefs);
		}
	}catch(e){
		this.updateInfo("Error: " + e);
	}
	
	
	//===================================================================
	//--> needed 4 ajax. y? idk... my bff jill
	//var that = this;

}
HelpdetailsAssistant.prototype.activate = function(event){
}
HelpdetailsAssistant.prototype.deactivate = function(event){
}
HelpdetailsAssistant.prototype.cleanup = function(event){
}
HelpdetailsAssistant.prototype.updateInfo = function(data){
	Mojo.Log.info("*** --> " + data);
	if (FreeRingtones.doInfo){
		this.controller.get("info").innerHTML = this.controller.get("info").innerHTML + data + "<br>";
	}
}


//=======================================================
//--> AJAX FUNCTIONS
//=======================================================
HelpdetailsAssistant.prototype.ajaxSuccess = function(transport, div){
	this.updateInfo("ajaxSuccess called for " + div);
	this.controller.get(div).innerHTML = transport.responseText;
	this.controller.get("loadSpinner").mojo.stop(); //spinnaz no mo!
}
HelpdetailsAssistant.prototype.ajaxFailure = function(transport, div){
	this.updateInfo("ajaxFailure called for " + div);
	this.controller.get(div + "_err").style.display = "";
	this.controller.get("loadSpinner").mojo.stop(); //spinnaz no mo!
}



//=======================================================
//--> CLOSE BUTTON FUNCTIONS
//=======================================================
HelpdetailsAssistant.prototype.closeHandler = function(event){
	this.controller.stageController.popScene();
}


//=======================================================
//--> OTHER FUNCTIONS
//=======================================================
HelpdetailsAssistant.prototype.handleCommand = function(event){
	if(event.type == Mojo.Event.command) {
		switch(event.command){
			case 'clock':
				this.btnManageClock();
				break;
			case 'calendar':
				this.btnManageCalendar();
				break;
			case 'sounds':
				this.btnManageSounds();
				break;
			case 'contacts':
				this.btnManageContacts();
				break;
			case 'email':
				this.btnManageEmail();
				break;
			case 'messaging':
				this.btnManageMessaging();
				break;
			case 'appcatalog':
				this.btnAppCatalog();
				break;
			case 'jamesapps':
				this.btnJamesApps();
				break;
			case 'close':
				this.controller.stageController.popScene();
				break;
			default:
				//Mojo.Controller.errorDialog("First Scene Command: " + event.command);
			break;
		}
	}
}

HelpdetailsAssistant.prototype.btnManageSounds = function(){
	try{
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'launch',
			parameters: {id: "com.palm.app.soundsandalerts"},
			onFailure:function(){
				this.controller.showAlertDialog({
					onChoose: function(value){
						//--> DO nothing
					},
					preventCancel: false,
					title: $L("Error"),
					message: $L("There was an error opening the Ringtone Management application."),
					choices:[
						{label:$L('Ok'), value:"ok", type:'dismissal'}
					]
				});
			}.bind(this)
		});
	}catch(e){
		//--> Error?	
	}
}
HelpdetailsAssistant.prototype.btnManageCalendar = function(){
	try{
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'launch',
			parameters: {id: "com.palm.app.calendar"},
			onFailure:function(){
				this.controller.showAlertDialog({
					onChoose: function(value){
						//--> DO nothing
					},
					preventCancel: false,
					title: $L("Error"),
					message: $L("There was an error opening the Calendar application."),
					choices:[
						{label:$L('Ok'), value:"ok", type:'dismissal'}
					]
				});
			}.bind(this)
		});
	}catch(e){
		//--> Error?	
	}
}
HelpdetailsAssistant.prototype.btnManageClock = function(){
	try{
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'launch',
			parameters: {id: "com.palm.app.clock"},
			onFailure:function(){
				this.controller.showAlertDialog({
					onChoose: function(value){
						//--> DO nothing
					},
					preventCancel: false,
					title: $L("Error"),
					message: $L("There was an error opening the Clock & Alarms application."),
					choices:[
						{label:$L('Ok'), value:"ok", type:'dismissal'}
					]
				});
			}.bind(this)
		});
	}catch(e){
		//--> Error?	
	}
}
HelpdetailsAssistant.prototype.btnManageContacts = function(){
	try{
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'launch',
			parameters: {id: "com.palm.app.contacts"},
			onFailure:function(){
				this.controller.showAlertDialog({
					onChoose: function(value){
						//--> DO nothing
					},
					preventCancel: false,
					title: $L("Error"),
					message: $L("There was an error opening the Contacts application."),
					choices:[
						{label:$L('Ok'), value:"ok", type:'dismissal'}
					]
				});
			}.bind(this)
		});
	}catch(e){
		//--> Error?	
	}
}
HelpdetailsAssistant.prototype.btnManageMessaging = function(){
	try{
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'launch',
			parameters: {id: "com.palm.app.messaging"},
			onFailure:function(){
				this.controller.showAlertDialog({
					onChoose: function(value){
						//--> DO nothing
					},
					preventCancel: false,
					title: $L("Error"),
					message: $L("There was an error opening the Messaging application."),
					choices:[
						{label:$L('Ok'), value:"ok", type:'dismissal'}
					]
				});
			}.bind(this)
		});
	}catch(e){
		//--> Error?	
	}
}
HelpdetailsAssistant.prototype.btnManageEmail = function(){
	try{
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'launch',
			parameters: {id: "com.palm.app.email"},
			onFailure:function(){
				this.controller.showAlertDialog({
					onChoose: function(value){
						//--> DO nothing
					},
					preventCancel: false,
					title: $L("Error"),
					message: $L("There was an error opening the Email application."),
					choices:[
						{label:$L('Ok'), value:"ok", type:'dismissal'}
					]
				});
			}.bind(this)
		});
	}catch(e){
		//--> Error?	
	}
}
HelpdetailsAssistant.prototype.btnAppCatalog = function(){
	try{
		this.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'launch',
			parameters: {id: "com.palm.app.findapps"},
			onFailure:function(){
				this.controller.showAlertDialog({
					onChoose: function(value){
						//--> DO nothing
					},
					preventCancel: false,
					title: $L("Error"),
					message: $L("There was an error opening the App Catalog."),
					choices:[
						{label:$L('Ok'), value:"ok", type:'dismissal'}
					]
				});
			}.bind(this)
		});
	}catch(e){
		//--> Error?	
	}
}
HelpdetailsAssistant.prototype.btnJamesApps = function(){
	try{
	    Mojo.Controller.stageController.pushScene("MoreApps");
	}catch(e){
		//--> Error?	
	}
}

