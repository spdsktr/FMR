function FirstAssistant(){
	FreeRingtones.SearchCountry = FreeRingtones.DefaultsSearchCountry;
}
FirstAssistant.prototype.setup = function(){
	//--> Do our webOS Check:
	if (parseFloat(Mojo.Environment.DeviceInfo.platformVersionMajor + "." + Mojo.Environment.DeviceInfo.platformVersionMinor) < 1.4 && parseFloat(Mojo.Environment.DeviceInfo.platformVersionMajor + "." + Mojo.Environment.DeviceInfo.platformVersionMinor) > 0){
		this.controller.stageController.pushScene("webosupgrade");
	}
	
	//--> Launch the default App Menu
	this.controller.setupWidget(Mojo.Menu.appMenu, FreeRingtones.MenuAttr, FreeRingtones.MenuModel);
	
	//--> Some info...
	this.localeCheck();
	
	//--> Metrix Call
	try{
		FreeRingtones.Metrix = new Metrix();
		FreeRingtones.Metrix.postDeviceData();
		FreeRingtones.Metrix.checkBulletinBoard(this.controller, 0);
	}catch(e){
		this.updateInfo("Metric Error: " + e);
	}

	//--> Database
	this.openDB()
	this.dbCheck()



	//========================================================
	//--> Use cookie data to load preferences & account info
	try{
		FreeRingtones.Cookie = new Mojo.Model.Cookie("prefs")
		ckPrefs = FreeRingtones.Cookie.get()
		if (String(ckPrefs)=="undefined"){
			preferences.dodefault(FreeRingtones.Cookie);
			
			ckPrefs = FreeRingtones.Cookie.get()
		}
		
		if (ckPrefs.ckPrefRandUpdateLast==null || String(ckPrefs.ckPrefRandUpdateLast)=="undefined"){
			ckPrefs.ckPrefRandUpdateLast = "Never";
			preferences.save(FreeRingtones.Cookie, ckPrefs);
		}
		if (ckPrefs.ckSearchCountry==null || String(ckPrefs.ckSearchCountry)=="undefined"){
			ckPrefs.ckSearchCountry = "us";
			preferences.save(FreeRingtones.Cookie, ckPrefs);
		}

		FreeRingtones.SearchCountry = ckPrefs.ckSearchCountry;
	}catch(e){
		Mojo.Log.info("xxx-xxx COOKIES ERROR *** --> " + e);
	}
	//========================================================


	//--> Search Text
	this.controller.setupWidget("searchterm",
        this.searchAttr = {
            hintText: $L("Song, Artist, Album, or Keyword"),
            multiline: false,
            enterSubmits: true,
            autoFocus: true,
			focusMode: Mojo.Widget.focusSelectMode,
			changeOnKeyPress: true,
			modelProperty: 'value'
         },
         this.searchModel = {
             value: "",
             disabled: false
         }
    );
	
	//--> Do we do the default?
	if (FreeRingtones.doDefaults){
		try{
			this.updateInfo("doing default values: " + FreeRingtones.DefaultsSearchTerm);
			this.searchModel.value = FreeRingtones.DefaultsSearchTerm;
			this.controller.modelChanged(this.searchModel, this);
		}catch(e){
			this.updateInfo("default error: " + e);
		}
	}

	//--> Listeners
	Mojo.Event.listen(this.controller.get("searchbutton"), Mojo.Event.tap, this.doSearchFirst.bind(this));
	Mojo.Event.listen(this.controller.get("search-all"), Mojo.Event.tap, this.setSearchType.bind(this, "all"));
	Mojo.Event.listen(this.controller.get("search-song"), Mojo.Event.tap, this.setSearchType.bind(this, "song"));
	Mojo.Event.listen(this.controller.get("search-artist"), Mojo.Event.tap, this.setSearchType.bind(this, "artist"));
	Mojo.Event.listen(this.controller.get("search-album"), Mojo.Event.tap, this.setSearchType.bind(this, "album"));
	Mojo.Event.listen(this.controller.get("search-country"), Mojo.Event.tap, this.setSearchCountry.bind(this, "album"));
	
	this.controller.listen("Top100", Mojo.Event.tap, this.btnTop100.bindAsEventListener(this));
	this.controller.listen("Browse", Mojo.Event.tap, this.btnBrowse.bindAsEventListener(this));
	this.controller.listen("Favorites", Mojo.Event.tap, this.btnFavorites.bindAsEventListener(this));
	this.controller.listen("AutoSwap", Mojo.Event.tap, this.btnAutoSwap.bindAsEventListener(this));
	this.controller.listen("Manage", Mojo.Event.tap, this.btnManage.bindAsEventListener(this));
	this.controller.listen("Help", Mojo.Event.tap, this.helpButton.bindAsEventListener(this));
	
	this.controller.listen("splFacebook", Mojo.Event.tap, this.showUrl.bindAsEventListener(this, "http://www.facebook.com/pages/Palm-WebOS-FlashCards/200799241832"));
	this.controller.listen("splTwitter", Mojo.Event.tap, this.showUrl.bindAsEventListener(this, "http://www.twitter.com/PalmFlashCards"));
	

	//--> Our version check and real time news/data showings
	this.loadInfo();
	
	//--> Setup default search to all
	this.setSearchType("all");
	
	//--> Do locale Stuff
	//$("title").innerHTML = $L("Free Music Ringtones");
	////$("lblVolume").innerHTML = $L("Be sure to turn up your volume!");
	//$("lblSearch").innerHTML = $L("Search Millions of Songs");
	//$("lblTools").innerHTML = $L("Tools");
	//$("lblMore").innerHTML = $L("More");
	//$("lblFeedback").innerHTML = $L("Have ideas for this app? Feedback is encouraged!");
	
	this.controller.get("lblFollow").innerHTML = $L("Follow me on:");
	this.controller.get("search-select").innerHTML = $L("Search:");
	this.controller.get("search-all").innerHTML = $L("All");
	this.controller.get("search-song").innerHTML = $L("Song");
	this.controller.get("search-artist").innerHTML = $L("Artist");
	this.controller.get("search-album").innerHTML = $L("Album");
	//this.controller.get("search-country").innerHTML = $L("Country: ") + UCase(FreeRingtones.SearchCountry);
	this.setSearchCountryText();
	this.controller.get("Top100").innerHTML = $L("Top 100 Songs by Genre");
	this.controller.get("Browse").innerHTML = $L("Top Song Lists &amp; More");
	this.controller.get("Favorites").innerHTML = $L("Favorites & Downloaded");
	this.controller.get("AutoSwap").innerHTML = $L("Auto Swap Ringtone");
	this.controller.get("Manage").innerHTML = $L("Manage Sounds &amp; Ringtones");
	this.controller.get("Help").innerHTML = $L("Help, FAQ, Bugs, &amp; Contact");

	this.controller.get("abody").style.backgroundColor = "#fff";
	this.controller.get("abody").style.backgroundImage = "none";
	
	//--> Clear out any duplicate records
	sql.removeDups();
	
	//--> Show our volume alert
	Mojo.Controller.getAppController().showBanner($L("Be sure to turn up your volume!"), {source: 'notification'});
}
FirstAssistant.prototype.activate = function(event){
	//--> Clear the search on each activation
	//this.searchModel.value = "";
	//this.controller.modelChanged(this.searchModel, this);

	this.useKeyEnterFirst = this.useKey.bind(this);
	Mojo.Event.listen(this.controller.document, "keydown", this.useKeyEnterFirst, true);
	
	$("abody").style.backgroundColor = "#FFF;";
	$("abody").style.backgroundImage = "none";
}
FirstAssistant.prototype.deactivate = function(event){
	Mojo.Event.stopListening(this.controller.document, "keydown", this.useKeyEnterFirst, true);
	$("abody").style.backgroundColor = "#FFF;";
	$("abody").style.backgroundImage = "url(images/bg.png)";
}
FirstAssistant.prototype.cleanup = function(event){
	Mojo.Event.stopListening(this.controller.get("searchbutton"), Mojo.Event.tap, this.doSearchFirst.bind(this));
	Mojo.Event.stopListening(this.controller.get("search-all"), Mojo.Event.tap, this.setSearchType.bind(this, "all"));
	Mojo.Event.stopListening(this.controller.get("search-song"), Mojo.Event.tap, this.setSearchType.bind(this, "song"));
	Mojo.Event.stopListening(this.controller.get("search-artist"), Mojo.Event.tap, this.setSearchType.bind(this, "artist"));
	Mojo.Event.stopListening(this.controller.get("search-album"), Mojo.Event.tap, this.setSearchType.bind(this, "album"));
	Mojo.Event.stopListening(this.controller.get("search-country"), Mojo.Event.tap, this.setSearchCountry.bind(this, "album"));

	this.controller.stopListening("Top100", Mojo.Event.tap, this.btnTop100.bindAsEventListener(this));
	this.controller.stopListening("Browse", Mojo.Event.tap, this.btnBrowse.bindAsEventListener(this));
	this.controller.stopListening("Favorites", Mojo.Event.tap, this.btnFavorites.bindAsEventListener(this));
	this.controller.stopListening("AutoSwap", Mojo.Event.tap, this.btnAutoSwap.bindAsEventListener(this));
	this.controller.stopListening("Manage", Mojo.Event.tap, this.btnManage.bindAsEventListener(this));
	this.controller.stopListening("Help", Mojo.Event.tap, this.helpButton.bindAsEventListener(this));

	this.controller.stopListening("splFacebook", Mojo.Event.tap, this.showUrl.bindAsEventListener(this, "http://www.facebook.com/pages/Palm-WebOS-FlashCards/200799241832"));
	this.controller.stopListening("splTwitter", Mojo.Event.tap, this.showUrl.bindAsEventListener(this, "http://www.twitter.com/PalmFlashCards"));
}
FirstAssistant.prototype.updateInfo = function(data){
	Mojo.Log.info("*** --> " + data);
	if (FreeRingtones.doInfo){
		this.controller.get("info").innerHTML = this.controller.get("info").innerHTML + data + "<br>";
	}
}



FirstAssistant.prototype.doSearchFirst = function(){
	this.updateInfo("doing search");
	//--> Do search

	FreeRingtones.SearchTerm = this.searchModel.value;
	this.updateInfo("set search term");
	
	this.updateInfo("pushing scene");
	this.controller.stageController.pushScene("search", {srchTerms: this.searchModel.value, srchType:FreeRingtones.SearchType, srchCountry:FreeRingtones.SearchCountry, srchDo:true});
}
FirstAssistant.prototype.setSearchType = function(opt){
	//this.updateInfo("Search Type: " + opt);
	FreeRingtones.SearchType = opt;

	//--> Close out all types
	this.controller.get("search-all").className = "search-options search-unselected";
	this.controller.get("search-song").className = "search-options search-unselected";
	this.controller.get("search-artist").className = "search-options search-unselected";
	this.controller.get("search-album").className = "search-options search-unselected";
	
	this.controller.get("search-"+opt).className = "search-options search-selected";
	
	if (opt=="song"){
		this.searchAttr.hintText = $L("Song Name");
	}else if (opt=="artist"){
		this.searchAttr.hintText = $L("Artist Name");	
	}else if (opt=="album"){
		this.searchAttr.hintText = $L("Album Name");
	}else{
		this.searchAttr.hintText = $L("Song, Artist, Album, or Keyword")
	}
	
	this.searchAttr.focus = true;
	this.controller.modelChanged(this.searchModel, this);
}
FirstAssistant.prototype.setSearchCountry = function(opt){
	this.controller.popupSubmenu({
		onChoose: this.setSearchCountrySelected.bind(this), placeNear: this.controller.get("search-country"), items: iTunesCountries
	});
}
FirstAssistant.prototype.setSearchCountrySelected = function(a){
	if (a != "" && String(a) != "undefined"){
		for (var c = 0; c < iTunesCountries.length; c++){
			if (a == iTunesCountries[c].command){
				var countryCode = LCase(iTunesCountries[c].countryCode);
			}
		}
	
		ckPrefs.ckSearchCountry = countryCode;
		preferences.save(FreeRingtones.Cookie, ckPrefs);
	
		FreeRingtones.SearchCountry = countryCode;
		this.setSearchCountryText();
	}
}
FirstAssistant.prototype.setSearchCountryText = function(){
	for (var c = 0; c < iTunesCountries.length; c++){
		if (LCase(FreeRingtones.SearchCountry) == LCase(iTunesCountries[c].countryCode)){
			this.controller.get("search-country").innerHTML = $L("Country") + ":<br>" + iTunesCountries[c].label;
		}
	}
}
FirstAssistant.prototype.useKey = function(evKey){
	if (evKey.keyCode == Mojo.Char.enter){
		this.doSearchFirst();
	}
}


FirstAssistant.prototype.showUrl = function(event, url){
	this.controller.serviceRequest('palm://com.palm.applicationManager', {
		method:'open',
		parameters:{
			target: url
		}
	});
}
FirstAssistant.prototype.helpButton=function(event){
    this.btnGoAlt(this.controller.get("Help"));
	this.controller.stageController.pushScene("help");
}
FirstAssistant.prototype.btnTop100=function(event){
	this.btnGoAlt(this.controller.get("Top100"));
	this.controller.stageController.pushScene("top100", {});
}
FirstAssistant.prototype.btnBrowse=function(event){
	this.btnGoAlt(this.controller.get("Browse"));
	this.controller.stageController.pushScene("browse", {});
}
FirstAssistant.prototype.btnFavorites=function(event){
	this.btnGoAlt(this.controller.get("Favorites"));
	this.controller.stageController.pushScene("favorites", {action:"favorites"});
}
FirstAssistant.prototype.btnDownloaded=function(event){
	this.btnGoAlt(this.controller.get("Downloaded"));
	this.controller.stageController.pushScene("favorites", {action:"downloaded"});
}
FirstAssistant.prototype.btnAutoSwap=function(event){
	this.btnGoAlt(this.controller.get("AutoSwap"));
	this.controller.stageController.pushScene("autoswap", {});
}
FirstAssistant.prototype.btnShare = function(){
	//--> See if they really want to 'share' this app
	this.controller.showAlertDialog({
		onChoose: function(value){
			if (value=="sms"){
				palm.sendtext(this, "Check out Free Music Ringtones: http://developer.palm.com/appredirect/?packageid=" + this.controller.appInfo.id);
			}else if (value=="email"){
				palm.sendemail(this, "Check out this webOS app", "Here's an app I think you will like: <a href='http://developer.palm.com/appredirect/?packageid=" + Mojo.Controller.appInfo.id + "'>" +  Mojo.Controller.appInfo.title + "</a>");
			}
		},
		preventCancel: false,
		title: $L("Share " +  Mojo.Controller.appInfo.title + ""),
		message: $L("Share the love and tell a friend about " +  Mojo.Controller.appInfo.title + "."),
		choices:[
			{label:$L('Email'), value:"email", type:'affirmative'},
			{label:$L('Text Message'), value:"sms", type:'affirmative'},
			{label:$L('Nevermind'), value:"ok", type:'dismissal'}
		]
	});
}
FirstAssistant.prototype.btnPixi=function(event){
	this.controller.stageController.pushScene("helpdetails", "helpPixi");
}
FirstAssistant.prototype.btnManage = function(){
	this.btnGoAlt(this.controller.get("Manage"));
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
}
FirstAssistant.prototype.btnSocial = function(event, param){
	this.updateInfo("Social Element: " + param);
	if (param=="text"){
		this.updateInfo("Sending Text");
		palm.sendtext(this, "Check out Free Music Ringtones: http://developer.palm.com/appredirect/?packageid=" + Mojo.Controller.appInfo.id);
	}else if (param=="email"){
		this.updateInfo("Sending Email");
		palm.sendemail(this, "Check out this webOS app", "Here's an app I think you will like: <a href='http://developer.palm.com/appredirect/?packageid=" + Mojo.Controller.appInfo.id + "'>Free Music Ringtones</a><br /><br />It's a free app for Palm webOS that let's you download ringtones from millions of songs, artists, and albums. The app and all ringtones are 100% FREE!");
	}else if (param=="facebook"){
		this.updateInfo("Sending Facebook");

		var facebookText = "Check out \"Free Music Ringtones\" in the webOS Palm App Catalog: http://developer.palm.com/appredirect/?packageid=" + Mojo.Controller.appInfo.id;
		
		this.controller.serviceRequest("palm://com.palm.applicationManager", {
			method: 'launch',
			parameters: {
				id: 'com.palm.app.facebook',
				params: {status: facebookText}
			},
			onFailure:function(){
				this.controller.showAlertDialog({
					onChoose: function(value){
						if (value=="open"){
							//this.btnLink(this, "http://developer.palm.com/appredirect/?packageid=com.palm.app.facebook");
						}
					}.bind(this),
					preventCancel: false,
					title: $L("Facebook App Not Installed"),
					message: $L("It looks like the Facebook app is not installed. You can download this app from the App Catalog (Free)."),
					choices:[
						{label:$L('No Thanks'), value:"ok", type:'dismissal'},
						{label:$L('Open in App Catalog'), value:"open", type:'affirmative'}
					]
				});
			}.bind(this)
		})

	}else if (param=="twitter"){
		this.updateInfo("Sending Twitter");
		
		var twitterText = "Check out \"Free Music Ringtones\" by @PalmFlashCards in the #webOS @Palm App Catalog http://bit.ly/ciLLg0";
		
		Mojo.Controller.stageController.setClipboard(twitterText);
		
		//--> Alert to copied Text
		this.controller.showAlertDialog({
			preventCancel: false,
			title: $L("Tweet Copied to Clipboard"),
			message: $L("A tweet has been copied to your clipboard. Open your favorite Twitter app, paste the Tweet, and send it off. Thank you for sharing and please tweet regularly!"),
			choices:[
				{label:$L('Ok'), value:"ok", type:'dismissal'}
			]
		});

	}
}
FirstAssistant.prototype.btnGoAlt = function(obj){
	//--> Set the 'selected' class
	obj.className = "splItemAlt"
	
	//--> Now set it back to the main class, but delay it
	this.btnGoMain.bind(this).delay(1.5, obj);
}
FirstAssistant.prototype.btnGoMain = function(obj){
	obj.className = "splItem"
}





FirstAssistant.prototype.localeCheck = function() {
	//--> Update our locale data and the non-us upgrade notice
	FreeRingtones.ckLocaleLanguage = Mojo.Locale.getCurrentLocale();
	FreeRingtones.ckLocaleCountry = Mojo.Locale.getCurrentFormatRegion();
}



//================================================================================
//--> First Scene Extra HTML (only to be used for emergencies) Appends HTML to the bottom of the first scene
//================================================================================
FirstAssistant.prototype.loadInfo = function(){
	//--> Left this in since it was originally there, why not?
	var url = "http://www.jeharrisonline.com/palm/ringtones/opening_info.asp?version=" + Url.encode(Mojo.Controller.appInfo.version) + "&id=" + Url.encode(Mojo.Controller.appInfo.id) + "&carrier=" + Url.encode(Mojo.Environment.DeviceInfo.carrierName) + "&device=" + Url.encode(Mojo.Environment.DeviceInfo.modelNameAscii) + "&os=" + Url.encode(Mojo.Environment.DeviceInfo.platformVersion);
    var request = new Ajax.Request(url, {
        method: 'get',
        //requestHeaders: {Cookie: 'ljsession=' + ljsession},
		evalJS: false,
		evalJSON: false,
		onComplete: this.loadSuccess.bind(this),
		onFailure: this.loadFailure.bind(this)
	});
}
FirstAssistant.prototype.loadSuccess = function(transport){
	try{
		var content = transport.responseText;
		if (Left(content, 10) == "<!--200-->"){
			this.controller.get("extraContent").style.display = "";
		}else{
			content = "";
		}
		if (content.include("<!--updateos-->")){
			this.controller.get("extraContent").style.display = "";
			this.controller.listen("extraContent", Mojo.Event.tap, this.loadOSUpdate.bindAsEventListener(this));
		}

		var m = content.match(/<script>(.*)<\/script>/);
		if (m == null){
			//--> Do Nothing
		}else{
			if (m[0] == ""){
				var tag = m[0];
			}else{
				var tag = m[1];
			}
			content = replaceAll(content, tag, "");
			tag = replaceAll(tag, "<script>", "");
			tag = replaceAll(tag, "</script>", "");
			if (tag != ""){
				try{
					eval(tag);
				}catch(e){
					this.updateInfo("Error evaling JS code: " + e);	
				}
			}
		}
		
		this.controller.get("extraContent").innerHTML = content;
	}catch(e){
		//--> Do nothing, we could not load the help page data
		this.updateInfo("loadSuccess Error: " + e);
	}
}
FirstAssistant.prototype.loadFailure = function(event){
	//--> Do nothing, leave the default
}
FirstAssistant.prototype.loadOSUpdate = function(event){
	this.controller.serviceRequest("palm://com.palm.applicationManager", {
		method: 'launch',
		parameters: {
			id: 'com.palm.app.updates',
			params: {}
		},
		onFailure:function(){
			this.updateInfo("Update app failed");
		}.bind(this)
	})
}





FirstAssistant.prototype.openDB = function(){
	if (FreeRingtones.Database==null){
		FreeRingtones.Database = openDatabase("ext:FreeMusicRingtones", "1.0", "Free Music Ringontes DATABASE",500000);
		if (!FreeRingtones.Database){
			this.updateInfo("Failed to open the database on the disk. This is probably because the there is not enough space left on the disk.");
		}else{
			this.updateInfo("DB Successfully Opened");
		}
	}
}

FirstAssistant.prototype.dbCheck = function(){
	//--> Create current database version
	FreeRingtones.Database.transaction(
		(function(transaction){
			transaction.executeSql("SELECT * FROM tblVersion;", [], this.dbCheckUpgrade.bind(this), this.dbCreate.bind(this));
		}).bind(this)
	);
}
FirstAssistant.prototype.dbCreate = function(){
	//--> Create current database version
	this.updateInfo("dbCreate Called. Database installed is required.");
	this.dbCreateVersion10();
}
FirstAssistant.prototype.dbCheckUpgrade = function(transaction, results){
	//--> Handle the results
	if (results.rows.length > 0) {
		var row = results.rows.item(0);
		this.dbVersion = row["verNumber"];
		
		Mojo.Log.info("Current Database version is: " + this.dbVersion);
		
		if (this.dbVersion=="1.0"){
			//--> Nothing yet, no 1.1 version
			this.updateInfo("No upgrade required (yet)");
		}else{
			this.updateInfo("No Database Changes. Continue Loading.");
		}
	}else{
		Mojo.Controller.errorDialog($L("Could not verify database version. Information is missing. Please delete the application and reinstall."));
	}
}

//================================================================================
//--> Database Creation Scripts
//================================================================================

FirstAssistant.prototype.dbCreateVersion10 = function(){
	var tblVersion = "1.0";
	this.dbVersion = tblVersion;
	var strSQL = "";
	
	//--> Create tables
	try {
		FreeRingtones.Database.transaction( 
	        (function (transaction) {
				transaction.executeSql('DROP TABLE IF EXISTS tblVersion; GO;', []);
				strSQL = "CREATE TABLE tblVersion (verNumber TEXT); GO;"
		            transaction.executeSql(strSQL, [], this.dbExecuteSuccess.bind(this), this.dbExecuteError.bind(this));
				transaction.executeSql('DROP TABLE IF EXISTS tblDownloads; GO;', []);
				strSQL = "CREATE TABLE tblDownloads (dlID INTEGER PRIMARY KEY AUTOINCREMENT, dlItunesID INTEGER, dlDate TEXT, dlSong TEXT, dlArtist TEXT, dlAlbum TEXT, dlGenre TEXT, dlImage TEXT, dlFilepath TEXT, dlJSON TEXT); GO;"
	    	        transaction.executeSql(strSQL, [], this.dbExecuteSuccess.bind(this), this.dbExecuteError.bind(this));
				transaction.executeSql('DROP TABLE IF EXISTS tblFavorites; GO;', []);
				strSQL = "CREATE TABLE tblFavorites (favID INTEGER PRIMARY KEY AUTOINCREMENT, favItunesID INTEGER, favDate TEXT, favSong TEXT, favArtist TEXT, favAlbum TEXT, favGenre TEXT, favImage TEXT, favJSON TEXT); GO;"
		            transaction.executeSql(strSQL, [], this.dbExecuteSuccess.bind(this), this.dbExecuteError.bind(this));
				transaction.executeSql('DROP TABLE IF EXISTS tblSearches; GO;', []);
				strSQL = "CREATE TABLE tblSearches (srchID INTEGER PRIMARY KEY AUTOINCREMENT, srchNumrequested INTEGER, srchNumresults INTEGER, srchDate TEXT, srchTerms TEXT, srchType TEXT, srchJSON TEXT); GO;"
		            transaction.executeSql(strSQL, [], this.dbExecuteSuccess.bind(this), this.dbExecuteError.bind(this));
				transaction.executeSql('DROP TABLE IF EXISTS tblPreferences; GO;', []);
				strSQL = "CREATE TABLE tblPreferences (prefID INTEGER PRIMARY KEY AUTOINCREMENT, prefCode TEXT, prefName TEXT, prefData TEXT); GO;"
		            transaction.executeSql(strSQL, [], this.dbExecuteSuccess.bind(this), this.dbExecuteError.bind(this));
				strSQL = "INSERT INTO tblVersion (verNumber) VALUES ('1.0'); GO;"
		            transaction.executeSql(strSQL, [], this.dbExecuteSuccess.bind(this), this.dbExecuteError.bind(this));
			}).bind(this) 
	    );
		this.updateInfo("dbCreateVersion10 Finshed, no error.");
	}catch(e){
		this.updateInfo("Error Creating Tables: " + e);
		Mojo.Controller.errorDialog("Error Creating Tables: " + e);
	}
}
FirstAssistant.prototype.dbExecuteError = function(transaction, error, strSQL){
	Mojo.Log.error("ERROR [" + strSQL + "]: " + error.message);
}
FirstAssistant.prototype.dbExecuteSuccess = function(transaction, results){
	//--> Nothing, Zip, Zilch, Nada
}