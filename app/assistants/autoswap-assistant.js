function AutoswapAssistant(params){
	this.params = params;
}
AutoswapAssistant.prototype.setup = function(){
	//--> Launch the default App Menu
	this.controller.setupWidget(Mojo.Menu.appMenu, FreeRingtones.MenuAttr, FreeRingtones.MenuModel);
	
	//--> Update the header
	this.controller.get("title").innerHTML = $L("Auto Swap Ringtone");

	//--> Repull our cookie data (to be sure)
	ckPrefs = FreeRingtones.Cookie.get()
	
	//--> Check cookie values... (and save)
	if (ckPrefs.ckPrefRandUpdateInterval == "" || String(ckPrefs.ckPrefRandUpdateInterval) == "undefined"){
		ckPrefs.ckPrefRandUpdateInterval = "00:05:00"
		preferences.save(FreeRingtones.Cookie, ckPrefs);
	}
	if (String(ckPrefs.ckPrefRandUpdateBackgroundEnable) == "undefined"){
		ckPrefs.ckPrefRandUpdateBackgroundEnable = false;
		preferences.save(FreeRingtones.Cookie, ckPrefs);
	}

	this.updateInfo("Step 1");
	try{
		//--> App Settings
		this.prefUpdateBackgroundEnableAttributes = {
			trueLabel: $L("Yes"), falseLabel: $L("No")
		};
		this.prefUpdateBackgroundEnableModel = {
			value: ckPrefs.ckPrefRandUpdateBackgroundEnable, disabled: false
		};
	
		this.prefUpdateIntervalList = [                  
			{label:$L('Never'), value:"00:00:00"},
			//{label:$L('1 Minute'), value:"00:01:00"},
			//{label:$L('2 Minutes'), value:"00:02:00"},
			//{label:$L('3 Minutes'), value:"00:03:00"},
			{label:$L('5 Minutes'), value:"00:05:00"},
			{label:$L('10 Minutes'), value:"00:10:00"},
			{label:$L('15 Minutes'), value:"00:15:00"},
			{label:$L('20 Minutes'), value:"00:20:00"},
			{label:$L('30 Minutes'), value:"00:30:00"},
			{label:$L('45 Minutes'), value:"00:45:00"},
			{label:$L('1 Hour'), value:"00:60:00"},
			{label:$L('1.5 Hours'), value:"00:90:00"},
			{label:$L('2 Hours'), value:"02:00:00"},
			{label:$L('3 Hours'), value:"03:00:00"},
			{label:$L('6 Hours'), value:"06:00:00"},
			{label:$L('12 Hours'), value:"12:00:00"},
			{label:$L('1 Day'), value:"23:59:59"},
			{label:$L('2 Days'), value:"47:59:59"}
		]
		if (ckPrefs.ckPrefRandUpdateBackgroundEnable){
			this.prefUpdateIntervalModel = {currentState: ckPrefs.ckPrefRandUpdateInterval, disabled: false};
		}else{
			this.prefUpdateIntervalModel = {currentState: ckPrefs.ckPrefRandUpdateInterval, disabled: true};
		}

		//--> Our search button
		this.downloadedButtonAttributes = {
			//type: Mojo.Widget.activityButton
		};
		this.downloadedButtonModel = {
			buttonLabel: $L('View Downloaded Ringtones'),
			buttonClass: 'primary',
			disabled: false
		};

		//--> Setup last ran
		this.controller.get("prefUpdateLast").innerHTML = ckPrefs.ckPrefRandUpdateLast;
		
		//--> Setup Widgets
		this.controller.setupWidget('prefUpdateBackgroundEnable', this.prefUpdateBackgroundEnableAttributes, this.prefUpdateBackgroundEnableModel);
		this.controller.setupWidget('prefUpdateInterval', {label: $L('Frequency'), choices: this.prefUpdateIntervalList, modelProperty:'currentState'}, this.prefUpdateIntervalModel);
		this.controller.setupWidget('Downloaded', this.downloadedButtonAttributes, this.downloadedButtonModel);
		
		Mojo.Event.listen(this.controller.get('prefUpdateBackgroundEnable'), Mojo.Event.propertyChange, this.Changed.bind(this));
		Mojo.Event.listen(this.controller.get('prefUpdateInterval'), Mojo.Event.propertyChange, this.Changed.bind(this));
		Mojo.Event.listen(this.controller.get('Downloaded'), Mojo.Event.tap, this.showDownloaded.bindAsEventListener(this));
		
		
		this.controller.get("lblSwapping").innerHTML = $L("Enable Swapping");
		this.controller.get("lblLastRan").innerHTML = $L("Last Ran");
	}catch(e){
		this.updateInfo("Setup Error: " + e);	
	}
	this.updateInfo("Setup complete...");
}
AutoswapAssistant.prototype.activate = function(event){
}
AutoswapAssistant.prototype.deactivate = function(event){
}
AutoswapAssistant.prototype.cleanup = function(event){
	Mojo.Event.stopListening(this.controller.get('prefUpdateBackgroundEnable'), Mojo.Event.propertyChange, this.Changed.bind(this));
	Mojo.Event.stopListening(this.controller.get('prefUpdateInterval'), Mojo.Event.propertyChange, this.Changed.bind(this));
}
AutoswapAssistant.prototype.handleCommand = function(event){
    if(event.type == Mojo.Event.command) {
        switch(event.command) {
			case 'order':
				break;
			default:
				//this.updateInfo("Command: " + event.command);
				//this.genre = event.command;
				//this.doGenre();
				//this.doSearch();
				//break;
			break;
		}
	}
}
AutoswapAssistant.prototype.updateInfo = function(data){
	Mojo.Log.info("*** --> " + data);
	if (FreeRingtones.doInfo){
		this.controller.get("info").innerHTML = this.controller.get("info").innerHTML + data + "<br>";
	}
}
AutoswapAssistant.prototype.Changed = function(event){
	this.updateInfo("Data Changed");
	try{
		ckPrefs.ckPrefRandUpdateBackgroundEnable				 = this.prefUpdateBackgroundEnableModel.value;
		ckPrefs.ckPrefRandUpdateInterval						 = this.prefUpdateIntervalModel['currentState'];

		//--> Now save it
		preferences.save(FreeRingtones.Cookie, ckPrefs);
		
		if (this.prefUpdateBackgroundEnableModel.value){
			//this.controller.get("").style.display = "":
			this.prefUpdateIntervalModel.disabled = false;
		}else{
			//this.controller.get("").style.display = "":
			this.prefUpdateIntervalModel.disabled = true;
		}
		this.controller.modelChanged(this.prefUpdateIntervalModel, this);
		
		
		//--> Now set it
		FreeRingtones.UpdateBackgroundEnable = ckPrefs.ckPrefRandUpdateBackgroundEnable;
		FreeRingtones.UpdateInterval = ckPrefs.ckPrefRandUpdateInterval;
		
		if (FreeRingtones.UpdateBackgroundEnable && FreeRingtones.UpdateInterval != "00:00:00"){
			this.wakeupRequest = new Mojo.Service.Request("palm://com.palm.power/timeout", {
				method: "set",
				parameters: {
					"key": Mojo.Controller.appInfo.id,
					"in": FreeRingtones.UpdateInterval,
					"wakeup": FreeRingtones.UpdateBackgroundEnable,
					"uri": "palm://com.palm.applicationManager/open",
					"params": {
						"id": Mojo.Controller.appInfo.id,
						"params": {"action": "swapRingtone"}
					}
				},
				onSuccess: function(response){
					this.updateInfo("*** --> setWakeup Alarm Set Success: " + response.returnValue + ", " + Object.toJSON(response.taskId));
					FreeRingtones.wakeupTaskId = Object.toJSON(response.taskId);
				}.bind(this),
				onFailure: function(response){
					this.updateInfo("*** --> setWakeup Alarm Set Failure: " + response.returnValue + response.errorText);
				}.bind(this)
			});
		}
	}catch(e){
		this.updateInfo("Changed Error: " + e);
	}
}
AutoswapAssistant.prototype.showDownloaded = function(event){
	this.controller.stageController.pushScene("favorites", {action:"downloaded"});
}