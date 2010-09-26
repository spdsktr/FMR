function SendtoappAssistant(params){
	this.params = params;
}
SendtoappAssistant.prototype.setup = function(){
	//--> Launch the default App Menu
	this.controller.setupWidget(Mojo.Menu.appMenu, FreeRingtones.MenuAttr, FreeRingtones.MenuModel);
	
	//--> Update the header
	this.controller.get("title").innerHTML = $L("Send to App");

	//--> Results List
	this.controller.setupWidget("resultslist",
        this.resultAttr = {
			itemTemplate: "sendtoapp/rowTemplate",
			listTemplate: "sendtoapp/listTemplate",
            swipeToDelete: false,
            reorderable: false
         },
         this.resultModel = {
             items : []
          }
    ); 

	//--> Setup loading spinner
	this.controller.setupWidget('loadSpinner',
		this.attributes = {
			spinnerSize: 'large'
		}, this.model = {
			spinning: true
		}
	);

	//--> Define Listeners
	Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bind(this));

	//--> Do we go ahead with the search?	
	this.doSearch();
	try{
		this.updateInfo("this.params.artworkUrl100 = " + this.params.artworkUrl100);
		this.controller.get("imgAlbumImage2").src = this.params.artworkUrl100;
	}catch(e){
		this.updateInfo("imgAlbumImage2 Error: " + e);
	}
}
SendtoappAssistant.prototype.activate = function(event){
}
SendtoappAssistant.prototype.deactivate = function(event){
}
SendtoappAssistant.prototype.cleanup = function(event){
	Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bind(this));
}
SendtoappAssistant.prototype.updateInfo=function(data){
	Mojo.Log.info("*** --> " + data);
	if (FreeRingtones.doInfo){
		this.controller.get("info").innerHTML = this.controller.get("info").innerHTML + data + "<br>";
	}
}
SendtoappAssistant.prototype.doSearch = function(){
	try{
		this.controller.get("loadSpinner").mojo.start(); //start da spinnaz!
	}catch(e){
		this.updateInfo("Spinner error: " + e);
	}

	//--> Update the header & results
	this.controller.get("results").style.display = "none";

	//--> Reset the model
	this.resultModel.items = [];
	this.controller.modelChanged(this.resultModel, this);
	
	new Ajax.Request("json/_sendtoapp.json", {
		method: 'get',
		evalJS: false,
		evalJSON: 'force',
		onSuccess: this.searchSuccess.bind(this),
		onFailure: this.searchFailure.bind(this)
	});

}
SendtoappAssistant.prototype.searchFailure = function(result){
	this.controller.get("loadSpinner").mojo.stop(); //stop da spinnaz!
	//--> See if they really want to 'share' this app
	this.controller.showAlertDialog({
		onChoose: function(value){
			//Mojo.Controller.stageController.popScene();
		},
		preventCancel: true,
		title: $L("Error"),
		message: $L("There was an error pulling the App list. Check your connection and try again."),
		choices:[
			{label:$L('Ok'), value:"ok", type:'dismissal'}
		]
	});
}
SendtoappAssistant.prototype.searchSuccess = function(result){
	this.items = result.responseText.evalJSON();

	this.countRecords = this.items.resultCount;

	//--> Da spinnaz!
	this.controller.get("loadSpinner").mojo.stop(); //start da spinnaz!
	
	if (this.countRecords == 0){
		this.updateInfo("No Supported Apps!");
		this.controller.get("noresults").style.display = "";
	}else{
		//--> Show the results area
		this.controller.get('results').style.display = "";

		this.controller.get("resultsnumber").innerHTML = this.countRecords;
		this.resultModel.items = this.items.results;
	}
	
	this.controller.modelChanged(this.resultModel, this);
}
SendtoappAssistant.prototype.resultTapListener = function(event){
	if (this.countRecords > 0){
		//this.controller.stageController.pushScene("send", {index: event.index, songs: this.resultModel.items});
		this.sendto_appid = event.item.appid;
		this.sendto_appname = event.item.appname;
		this.appicon = event.item.appicon;
		this.sendto_minversion = event.item.appminversion;
		this.sendto_url = event.item.appurl;
		
		this.btnSendtoAppDo();
	}
}
SendtoappAssistant.prototype.btnSendtoAppDo = function(){
	this.controller.serviceRequest("palm://com.palm.applicationManager", {
		method: 'open',
		parameters: {
			id: this.sendto_appid,
			params: {action: 'saveAlertFile', alertFile: this.params.alertFile, alertName: this.params.alertName}
		},
		onSuccess:function(){
			//--> No more notifications, let the app handle it!
			//Mojo.Controller.getAppController().showBanner("v" + this.sendto_minversion + $L(" or Greater Required"), {source: 'notification'});
			
			//--> Now pop the scene
			this.controller.stageController.popScene();
		}.bind(this),
		onFailure:function(){
			this.controller.showAlertDialog({
				onChoose: function(value){
					if (value=="yes"){
						//--> WHich URL to use?
						if (this.sendto_url != "" && String(this.sendto_url) != "undefined"){
							this.url = this.sendto_url;
						}else{
							this.url = "http://developer.palm.com/appredirect/?packageid=" + this.sendto_appid;
						}
						//--> And weee'rrre.. of to see the wizard
						this.controller.serviceRequest('palm://com.palm.applicationManager', {
							method:'open',
							parameters:{
								target: this.url
							}
						});
					}
				},
				preventCancel: false,
				title: this.sendto_appname + " " + $L("Not Installed"),
				message: this.sendto_appname + $L(" is not installed. Would you like to download it?"),
				choices:[
					{label:$L('Yes'), value:"yes", type:'affirmative'},
					{label:$L('No'), value:"no", type:'dismissal'}
				]
			});
		}.bind(this)
	})
}