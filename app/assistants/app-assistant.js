FreeRingtones = {};														//--> Global!

// Constants
FreeRingtones.doInfo					 = true;						//--> Do we show in app debugging data?
FreeRingtones.doDefaults				 = false;						//--> Do we do some default search values?
FreeRingtones.DefaultBackground			 = "#F2F2F2";					//--> Default App Background style
FreeRingtones.SearchTerm				 = "";							//--> For the search, the term to use
FreeRingtones.SearchType				 = "";							//--> For the search, the type to use
FreeRingtones.SearchCountry				 = "";							//--> For the search, the country to use
FreeRingtones.labelstyles				 = "font-size:13px;";			//--> Style for some of our labels

//--> Stages
FreeRingtones.MainStageName				 = "rtStage";					//--> Our main stage (where we perform, duh!)
FreeRingtones.DashboardStageName		 = "rtDashboard";				//--> Our dashboard stage (where the bobbleheads go, duh!)


//--> Default Values
FreeRingtones.Database					 = null;						//--> Our database
FreeRingtones.DefaultsSearchTerm		 = "Bed Intruder";				//--> If we are using a default search term, this is what it is
FreeRingtones.DefaultsSearchCountry		 = "us";						//--> The default country to use for searches


//--> Randomizer
FreeRingtones.UpdateBackgroundEnable	 = false;    					//--> Enable device wakeup 
FreeRingtones.UpdateInterval			 = "00:00:00"					//--> The update frequency
FreeRingtones.wakeupTaskId				 = 0;							//--> Id for wakeup tasks


//--> Holds the data
FreeRingtones.Cookie					 = null;						//--> Mmmm, baking :)
FreeRingtones.Data						 = {};							//--> idk what this is for
FreeRingtones.Folder					 = "ringtones";					//--> The folder where ringtones are stored
FreeRingtones.AlbumFolder				 = "Album Cover Artwork";		//--> The folder where album art goes
var ckPrefs								 = null;						//--> Holds our preferences! I like puppies personally.



//--> Menu Options
FreeRingtones.MenuAttr = {omitDefaultItems: true};
FreeRingtones.MenuModel = {
    visible: true,
    items: [ 
		Mojo.Menu.editItem,
		{label: $L("Search"), command: "search"},
		{label: $L("Top 100"), command: "top100"},
		{label: $L("Browse Lists"), command: "browse"},
		{label: $L("Favorites & Downloaded"), command: "favorites"},
		{label: $L("Auto Swap Ringtones"), command: "autoswap"},
		{label: $L("Help"), command: "help"}
    ]
};




function AppAssistant(appController){
}
AppAssistant.prototype.setup = function(){
	try{
		FreeRingtones.Cookie = new Mojo.Model.Cookie("prefs")
		ckPrefs = FreeRingtones.Cookie.get()
		if (String(ckPrefs)=="undefined"){
			preferences.dodefault(FreeRingtones.Cookie);
			
			ckPrefs = FreeRingtones.Cookie.get()
		}
		
		//--> Set the preferences
		FreeRingtones.UpdateBackgroundEnable = ckPrefs.ckPrefRandUpdateBackgroundEnable;
		FreeRingtones.UpdateInterval = ckPrefs.ckPrefRandUpdateInterval;
		
		//--> Now open the database connection
		this.openDB()

		//--> Set up first timeout alarm
		this.setWakeup();
	}catch(e){
		Mojo.Log.error("setup Error: " + e);
	}
}

//  -------------------------------------------------------
//  handleLaunch - called by the framework when the application is asked to launch
AppAssistant.prototype.handleLaunch = function(launchParams){
	Mojo.Log.info("*** --> ReLaunch");

	try{
		var cardStageController = this.controller.getStageController(FreeRingtones.MainStageName);
		var appController = Mojo.Controller.getAppController();
	
		//--> Reset up the cookies
		FreeRingtones.Cookie = new Mojo.Model.Cookie("prefs")
		ckPrefs = FreeRingtones.Cookie.get()
		if (String(ckPrefs)=="undefined"){
			preferences.dodefault(FreeRingtones.Cookie);
			
			ckPrefs = FreeRingtones.Cookie.get()
		}
		
		//--> Set the preferences
		FreeRingtones.UpdateBackgroundEnable = ckPrefs.ckPrefRandUpdateBackgroundEnable;
		FreeRingtones.UpdateInterval = ckPrefs.ckPrefRandUpdateInterval;
		
		//--> Nolaunch params? Shazam!
		if (!launchParams)  {
			//---------------------------------------------------------
			// FIRST LAUNCH
			//---------------------------------------------------------
			if (cardStageController) {
				// If it exists, just bring it to the front by focusing its window.
				cardStageController.popScenesTo("first");    
				cardStageController.activate();
			}else{
				// Create a callback function to set up the new main stage once it is done loading. It is passed the new stage controller as the first parameter.
				var pushMainScene = function(stageController) {
					stageController.pushScene("first");
				}
				
				var stageArguments = {name: FreeRingtones.MainStageName, lightweight: false};
				this.controller.createStageWithCallback(stageArguments, pushMainScene.bind(this), "card");        
			}
		}else{
			Mojo.Log.info("*** --> Wakeup Call", launchParams.action);  
			switch (launchParams.action){
				//---------------------------------------------------------
				// SWAP RINGTONE
				//---------------------------------------------------------
				case "swapRingtone":
					if (FreeRingtones.UpdateInterval !== "00:00:00" && FreeRingtones.UpdateBackgroundEnable){
						//--> Set next wakeup alarm
						this.setWakeup();
						
						//--> Swap the ringtone
						this.swapRingtone();
					}
					break;
					
				//---------------------------------------------------------
				// SEARCH
				//---------------------------------------------------------
				case "search":
					if (cardStageController) {
						cardStageController.popScenesTo("first");
						cardStageController.pushScene("search", {srchTerms:launchParams.srchTerms, srchType:launchParams.srchType, srchCountry:launchParams.srchCountry, srchDo:true});
						cardStageController.activate();
					}else{
						var pushMainScene2 = function(stageController) {
							stageController.pushScene("first");
							stageController.pushScene("search", {srchTerms:launchParams.srchTerms, srchType:launchParams.srchType, srchCountry:launchParams.srchCountry, srchDo:true});
						};
						var stageArguments2 = {name: FreeRingtones.MainStageName, lightweight: false};
						this.controller.createStageWithCallback(stageArguments2, pushMainScene2.bind(this), "card");
					}
					break;
	
	
				//---------------------------------------------------------
				// TOP 100
				//---------------------------------------------------------
				case "top100":
					if (cardStageController) {
						cardStageController.popScenesTo("first");
						cardStageController.pushScene("top100");
						cardStageController.activate();
					}else{
						var pushMainScene2 = function(stageController) {
							stageController.pushScene("first");
							stageController.pushScene("top100");
						};
						var stageArguments2 = {name: FreeRingtones.MainStageName, lightweight: false};
						this.controller.createStageWithCallback(stageArguments2, pushMainScene2.bind(this), "card");
					}
					break;
	
				//---------------------------------------------------------
				// FAVORITES
				//---------------------------------------------------------
				case "favorites":
					if (cardStageController) {
						cardStageController.popScenesTo("first");
						cardStageController.pushScene("favorites", {action:"favorites"});
						cardStageController.activate();
					}else{
						var pushMainScene2 = function(stageController) {
							stageController.pushScene("first");
							stageController.pushScene("favorites", {action:"favorites"});
						};
						var stageArguments2 = {name: FreeRingtones.MainStageName, lightweight: false};
						this.controller.createStageWithCallback(stageArguments2, pushMainScene2.bind(this), "card");
					}
					break;
	
				//---------------------------------------------------------
				// DOWNLOADED
				//---------------------------------------------------------
				case "downloaded":
					if (cardStageController) {
						cardStageController.popScenesTo("first");
						cardStageController.pushScene("favorites", {action:"downloaded"});
						cardStageController.activate();
					}else{
						var pushMainScene2 = function(stageController) {
							stageController.pushScene("first");
							stageController.pushScene("favorites", {action:"downloaded"});
						};
						var stageArguments2 = {name: FreeRingtones.MainStageName, lightweight: false};
						this.controller.createStageWithCallback(stageArguments2, pushMainScene2.bind(this), "card");
					}
					break;
	
	
				//---------------------------------------------------------
				// AUTO SWAP
				//---------------------------------------------------------
				case "autoswap":
					if (cardStageController) {
						cardStageController.popScenesTo("first");
						cardStageController.pushScene("autoswap");
						cardStageController.activate();
					}else{
						var pushMainScene2 = function(stageController) {
							stageController.pushScene("first");
							stageController.pushScene("autoswap");
						};
						var stageArguments2 = {name: FreeRingtones.MainStageName, lightweight: false};
						this.controller.createStageWithCallback(stageArguments2, pushMainScene2.bind(this), "card");
					}
					break;
	
				//---------------------------------------------------------
				// BROWSE
				//---------------------------------------------------------
				case "browse":
					if (cardStageController) {
						cardStageController.popScenesTo("first");
						cardStageController.pushScene("browse");
						cardStageController.activate();
					}else{
						var pushMainScene2 = function(stageController) {
							stageController.pushScene("first");
							stageController.pushScene("browse");
						};
						var stageArguments2 = {name: FreeRingtones.MainStageName, lightweight: false};
						this.controller.createStageWithCallback(stageArguments2, pushMainScene2.bind(this), "card");
					}
					break;

				//---------------------------------------------------------
				// DEFAULT (in case something breaks in the future, just load er up)
				//---------------------------------------------------------
				default:
					if (cardStageController) {
						cardStageController.popScenesTo("first");
						cardStageController.activate();
					}else{
						var pushMainScene2 = function(stageController) {
							stageController.pushScene("first");
						};
						var stageArguments2 = {name: FreeRingtones.MainStageName, lightweight: false};
						this.controller.createStageWithCallback(stageArguments2, pushMainScene2.bind(this), "card");
					}
					break;

			}
		}
	}catch(e){
		Mojo.Log.error("handleLaunch Error: " + e);
	}
}

// -----------------------------------------
// handleCommand - called to handle app menu selections
AppAssistant.prototype.handleCommand = function(event){
    var stageController = this.controller.getActiveStageController();
    var currentScene = stageController.activeScene();
    if(event.type == Mojo.Event.command) {
        switch(event.command) {
			case "search":
				stageController.pushScene("search", {});
				break;
			case "top100":
				stageController.pushScene("top100");
				break;
			case "favorites":
				stageController.pushScene("favorites", {action:"favorites"});
				break;
			case "downloaded":
				stageController.pushScene("favorites", {action:"downloaded"});
				break;
			case "browse":
				stageController.pushScene("browse");
				break;
			case "autoswap":
				stageController.pushScene("autoswap");
				break;
			case "feedback":
				stageController.pushScene("about");
				break;
			case "help":
				stageController.pushScene("help");
				break;
			case "manage":
				this.launchRingtoneManager();
				break;
        }
    }
}
AppAssistant.prototype.setWakeup = function(){
	//Mojo.Log.info("*** --> App Assistant setWakeup Called ***");
	try{
		if (FreeRingtones.UpdateInterval !== "00:00:00")   {
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
					Mojo.Log.info("*** --> setWakeup Alarm Set Success", response.returnValue);
					FreeRingtones.wakeupTaskId = Object.toJSON(response.taskId);
				},
				onFailure: function(response){
					Mojo.Log.info("*** --> setWakeup Alarm Set Failure", response.returnValue, response.errorText);
				}
			});
		}
	}catch(e){
		Mojo.Log.error("setWakeup Error: " + e)	
	}
}
AppAssistant.prototype.openDB = function(){
	try{
		if (FreeRingtones.Database==null){
			FreeRingtones.Database = openDatabase("ext:FreeMusicRingtones", "1.0", "Free Music Ringontes DATABASE",500000);
			if (!FreeRingtones.Database){
				Mojo.Log.info("Failed to open the database on the disk. This is probably because the there is not enough space left on the disk.");
			}else{
				Mojo.Log.info("DB Successfully Opened");
			}
		}
	}catch(e){
		Mojo.Log.error("openDB Error: " + e);
	}
}

AppAssistant.prototype.swapRingtone = function(){
	try{
		var today = new Date();
		Mojo.Log.info("****************************************************************");
		Mojo.Log.info("*** --> swapRingtone Called @ " + today);
		
		//--> Open database again if needed	
		if (FreeRingtones.Database == null){
			this.openDB();
		}

		//--> Update the last Ran Date
		ckPrefs.ckPrefRandUpdateLast = Mojo.Format.formatDate(today, "short");
		preferences.save(FreeRingtones.Cookie, ckPrefs);


		FreeRingtones.Database.transaction(
			(function(readTransaction){
				try {
					readTransaction.executeSql("SELECT dlID, dlSong, dlArtist, dlFilepath, (Random()) AS dlRandom FROM tblDownloads ORDER BY dlRandom ASC LIMIT 1;", [], 
						(function(transaction, results){
							//--> Success! Now, do we have rows?
							if (results.rows.length > 0){
								var row = results.rows.item(0);
								
								var dlID = row["dlID"];
								var dlSong = row["dlSong"];
								var dlArtist = row["dlArtist"];
								var dlFilepath = row["dlFilepath"];
								//dlJSON  = Mojo.parseJSON(row["dlJSON"]);
								Mojo.Log.info("*** --> Ringtone Chosen: " + dlFilepath);
								
								var fileExistCheckRequest = new Ajax.Request(dlFilepath, {
									method: 'get',
									onSuccess: function(){
										//--> Ok, now set the ringtone!
										var request = new Mojo.Service.Request("palm://com.palm.systemservice", {
											method: "setPreferences",
											parameters: {
												"ringtone": {
													"fullPath": dlFilepath,
													"name": dlArtist + " - " + dlSong
												}
											},
											onSuccess: function(e){
												Mojo.Log.info("*** --> Ringtone Set Success. Next one in " + FreeRingtones.UpdateInterval);
												Mojo.Controller.getAppController().showBanner($L("Ringtone Changed"), {source: 'notification'});
											}.bind(this),
											onFailure:function(e){
												Mojo.Log.info("*** --> Ringtone Set FAIL");
												Mojo.Controller.getAppController().showBanner($L("Ringtone Change FAILED"), {source: 'notification'});
											}.bind(this)
										});
									}.bind(this),
									onFailure: function(){
										Mojo.Log.info("*** --> Ringtone not found [500] :(");
										Mojo.Controller.getAppController().showBanner($L("Ringtone not found"), {source: 'notification'});
										FreeRingtones.Database.transaction( 
											(function (transaction) {
												transaction.executeSql("DELETE FROM tblDownloads WHERE dlID = " + dlID + "", []);
												Mojo.Log.info("*** --> Ringtone removed from Downloads");
											}).bind(this) 
										);
									}.bind(this),
									on0: function(){
										Mojo.Log.info("*** --> Ringtone not found [0] :(");
										Mojo.Controller.getAppController().showBanner($L("Ringtone not found"), {source: 'notification'});
										FreeRingtones.Database.transaction( 
											(function (transaction) {
												transaction.executeSql("DELETE FROM tblDownloads WHERE dlID = " + dlID + "", []);
												Mojo.Log.info("*** --> Ringtone removed from Downloads");
											}).bind(this) 
										);
									}.bind(this)
								});
							}else{
								Mojo.Log.info("*** --> No ringtones to set :(");
								Mojo.Controller.getAppController().showBanner($L("No Available Ringtones"), {source: 'notification'});
							}
						}).bind(this), 
						(function(transaction){
							//--> Error?
							Mojo.Controller.getAppController().showBanner($L("Error Swapping Ringtone"), {source: 'notification'});
						}).bind(this)
					);
				}catch(e){
					Mojo.Controller.errorDialog(e);
				}
			}).bind(this)
		);
	}catch(e){
		Mojo.Log.error("swapRingtone Error: " + e);
	}
}