function FavoritesAssistant(params){
	this.params = params;
	
	this.genre = "0";
	this.limit = 100;
	this.count = 0;
	this.sortName = "favDate";
	this.sortOrder = "DESC";
	this.filtered = false;
	this.subset = [];
}
FavoritesAssistant.prototype.setup = function(){
	//--> Launch the default App Menu
	this.controller.setupWidget(Mojo.Menu.appMenu, FreeRingtones.MenuAttr, FreeRingtones.MenuModel);
	
	//--> Update the header
	this.controller.get("title").innerHTML = $L("Favorites");

	//--> Results List
	this.controller.setupWidget("resultslist",
        this.resultAttr = {
			itemTemplate: "search/rowTemplate",
			listTemplate: "search/listTemplate",
			filterFunction: this.listFilterHandler.bind(this),
			delay: 500,
            hasNoWidgets: true,
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

	this.commandMenuModel = {
		menuClass:		'blue',
		items: [
			{
				label:				"<span style='" + FreeRingtones.labelstyles + "'>" + $L("Clear") + "</span>",
				command:			"clear",
				disabled:			true
			},
			{},
			{ items: this.commandButtons = [
				{
					iconPath:		"images/icon-time.png",
					label:			"Sort by Date",
					command:		"time",
					disabled:		false
				},
				{
					iconPath:		"images/icon-atoz.png",
					label:			"Sort Alphabetically",
					command:		"atoz",
					disabled:		false
				}
				],
					toggleCmd:		"time"
				},
			{},
			{
				command:			"email",
				iconPath:			"images/email-32x32.png",
				disabled:			false
			}
		]
	};

	//--> Setup the control menu
	this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.commandMenuModel);

	//--> Define Listeners
	Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bind(this));
	Mojo.Event.listen(this.controller.get("selectorPillHit"), Mojo.Event.tap, this.handleSelectorPill.bind(this)); 
	Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.filterImmediate, this.listFilter.bind(this));
	
	//--> Do localization
	this.controller.get("noresults").innerHTML = $L("There are currently no records");
	
	//--> Setup "clear" option
	this.handleClear()
	
	//--> Do Header
	if (this.params.action=="downloaded"){
		this.controller.get("selectorPillSelection").innerHTML = $L("Downloaded");
		this.controller.get("title").innerHTML = $L("Downloaded");
	}else{
		this.controller.get("selectorPillSelection").innerHTML = $L("Favorites");
		this.controller.get("title").innerHTML = $L("Favorites");
	}
}
FavoritesAssistant.prototype.activate = function(event){
	//--> Do we go ahead with the search?	
	this.doSearch();
}
FavoritesAssistant.prototype.deactivate = function(event){
}
FavoritesAssistant.prototype.cleanup = function(event){
	Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bind(this));
	Mojo.Event.stopListening(this.controller.get("selectorPillHit"), Mojo.Event.tap, this.handleSelectorPill.bind(this));
	Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.filterImmediate, this.listFilter.bind(this));
}
FavoritesAssistant.prototype.handleCommand = function(event){
    if(event.type == Mojo.Event.command) {
        switch(event.command) {
			case 'atoz':
				if (this.sortName=="favSong"){
					if (this.sortOrder=="ASC"){
						this.sortOrder = "DESC";
					}else{
						this.sortOrder = "ASC";
					}
				}else{
					this.sortName = "favSong";
					this.sortOrder = "ASC";
				}
				//--> First, scroll to the top...
				Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();

				this.doSearch();
				break;
			case 'time':
				if (this.sortName=="favDate"){
					if (this.sortOrder=="ASC"){
						this.sortOrder = "DESC";
					}else{
						this.sortOrder = "ASC";
					}
				}else{
					this.sortName = "favDate";
					this.sortOrder = "DESC";
				}
				//--> First, scroll to the top...
				Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();

				this.doSearch();
				break;
			case 'order':
				if (this.sortName=="favArtist"){
					if (this.sortOrder=="ASC"){
						this.sortOrder = "DESC";
					}else{
						this.sortOrder = "ASC";
					}
				}else{
					this.sortName = "favArtist";
					this.sortOrder = "ASC";
				}
				//--> First, scroll to the top...
				Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();

				this.doSearch();
				break;
			case 'email':
				this.doEmail();
				break;
			case 'clear':
				this.clearRecords();
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
FavoritesAssistant.prototype.handleClear=function(){
	if (this.params.action=="downloaded"){
		this.commandMenuModel.items[0].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("Manage") + "</span>";
		this.commandMenuModel.items[0].disabled = false;
		this.controller.modelChanged(this.commandMenuModel, this);
		
	}else{
		this.commandMenuModel.items[0].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("Clear") + "</span>";
		this.commandMenuModel.items[0].disabled = false;
		this.controller.modelChanged(this.commandMenuModel, this);
	}
}
FavoritesAssistant.prototype.updateInfo=function(data){
	Mojo.Log.info("*** --> " + data);
	if (FreeRingtones.doInfo){
		this.controller.get("info").innerHTML = this.controller.get("info").innerHTML + data + "<br>";
	}
}
FavoritesAssistant.prototype.doSearch = function(){
	try{
		this.controller.get("loadSpinner").mojo.start(); //start da spinnaz!
	}catch(e){
		this.updateInfo("Spinner error: " + e);
	}

	//--> Reset the model
	this.resultModel.items = [];
	this.controller.modelChanged(this.resultModel, this);

	//this.url = "http://ax.phobos.apple.com.edgesuite.net/WebObjects/MZStore.woa/wpa/MRSS/topsongs/sf=" + this.countryITunes + "/limit=" + this.limit + "/rss.xml";
	if (this.params.action=="downloaded"){
		FreeRingtones.Database.transaction(
			(function(readTransaction){
				try {
					this.tempsortName = replaceAll(this.sortName, "fav", "dl");
					readTransaction.executeSql("SELECT * FROM tblDownloads ORDER BY " + this.tempsortName + " " + this.sortOrder + ";", [], this.searchSuccess.bind(this), this.searchFailure.bind(this));
				}catch(e){
					Mojo.Controller.errorDialog(e);
				}
	
			}).bind(this)
		);
	}else{
		FreeRingtones.Database.transaction(
			(function(readTransaction){
				try {
					this.tempsortName = this.sortName
					readTransaction.executeSql("SELECT * FROM tblFavorites ORDER BY " + this.tempsortName + " " + this.sortOrder + ";", [], this.searchSuccess.bind(this), this.searchFailure.bind(this));
				}catch(e){
					Mojo.Controller.errorDialog(e);
				}
			}).bind(this)
		);
	}
}
FavoritesAssistant.prototype.searchFailure = function(results){
	this.controller.get("loadSpinner").mojo.stop(); //stop da spinnaz!
	try{
		//--> See if they really want to 'share' this app
		this.controller.showAlertDialog({
			onChoose: function(value){
				//Mojo.Controller.stageController.popScene();
			},
			preventCancel: true,
			title: $L("Error"),
			message: $L("There was an error pulling your Favorites. Check your connection and try again."),
			choices:[
				{label:$L('Ok'), value:"ok", type:'dismissal'}
			]
		});
	}catch(e){
		//--> Error?
	}
}
FavoritesAssistant.prototype.searchSuccess = function(transaction, results){
	try{
		this.updateInfo("searchSuccess Called: " + results.rows.length);
		this.count = results.rows.length;
		
		if (results.rows.length > 0){
			//--> Update the title bar with the count
			this.controller.get('results').style.display = "";
			this.controller.get("resultsnumber").innerHTML = this.count;
			this.controller.get("noresults").style.display = "none";
			this.controller.get("results").style.display = "";
			
			for (var i = 0; i < results.rows.length; i++){
				var row = results.rows.item(i);
				
				if (this.params.action=="downloaded"){
					recID = row["dlID"];
					recFilepath = row["dlFilepath"];
					recJSON = Mojo.parseJSON(row["dlJSON"]);
				}else{
					recID = row["favID"];
					recFilepath = "";
					recJSON = Mojo.parseJSON(row["favJSON"]);
				}

				//--> Scrub the rank out
				if (String(recJSON.rank) !="undefined" && recJSON.rank.length != 0 && recJSON.rank.length > 0 && recJSON.rank.length < 4){
					recJSON.trackName = this.scrubRank(recJSON.trackName, recJSON.rank);
					recJSON.rank = 0;
				}

				//this.updateInfo("Added Item to Array -- ID: " + setID + ", setName = " + setName);
				this.resultModel.items.push(recJSON);
				
				//--> See if the item still exists
				if (recFilepath != ""){
					//--> Yeah, this locks up the device...
					//this.testExist(recFilepath, recID);
				}
			}
		}else{
			this.controller.get("noresults").style.display = "";
			this.controller.get("results").style.display = "none";
			this.updateInfo("tblFavorites is empty!");
		}
		
		//--> Stop the spinnaz!
		try{
			this.controller.get("loadSpinner").mojo.stop(); //start da spinnaz!
		}catch(e){
		}
		this.controller.modelChanged(this.resultModel, this);

		//--> Do the background cover artwork
		bg.assignCovers(this, this.resultModel.items);
	}catch(e){
		this.updateInfo("Error in searchSuccess: " + e)	;
	}
}
FavoritesAssistant.prototype.doEmail = function(){
	//--> Setup the subject
	if (this.params.action=="downloaded"){
		this.subject = $L("My Downloaded Ringtones");
	}else{
		this.subject = $L("My Favorites");
	}

	//--> Set Up Pre Email
	this.email = "";
	this.email = this.email + "<br>";

	this.email = this.email + "<table cellspacing=0 cellpadding=2 border=1>";
	this.email = this.email + "<tr>";
		this.email = this.email + "<td><b>" + $L("Artist") + "</b></td>";
		this.email = this.email + "<td><b>" + $L("Song") + "</b></td>";
		this.email = this.email + "<td><b>" + $L("Album") + "</b></td>";
		this.email = this.email + "<td><b>" + $L("Purchase this Song") + "</b></td>";
	this.email = this.email + "</tr>";

	//--> Loop Through Items
	for (var i = 0; i < this.resultModel.items.length; i++){
		this.urlAmazon = "http://www.amazon.com/gp/redirect.html?ie=UTF8&location=http%3A%2F%2Fwww.amazon.com%2Fs%3Fie%3DUTF8%26x%3D0%26ref_%3Dnb%5Fsb%5Fnoss%26y%3D0%26field-keywords%3D" + Url.encode(this.scrubBadParts(this.resultModel.items[i].artistName)) + "%2520-%2520" + this.scrubBadParts(this.resultModel.items[i].trackName) + "%26url%3Dsearch-alias%253Ddigital-music&tag=jeharrisonlin-20&linkCode=ur2&camp=1789&creative=390957";
		
		this.email = this.email + "<tr>";
			this.email = this.email + "<td>" + this.scrubBadParts(this.resultModel.items[i].artistName) + "</td>";
			this.email = this.email + "<td>" + this.scrubBadParts(this.resultModel.items[i].trackName) + "</td>";
			this.email = this.email + "<td>" + this.scrubBadParts(this.resultModel.items[i].collectionName) + "</td>";
			this.email = this.email + "<td><a href='" + this.urlAmazon + "'>Amazon</a> | <a href='" + this.resultModel.items[i].trackViewUrl + "'>iTunes</a></td>";
		this.email = this.email + "</tr>";
	}

	//--> Finish Email Body
	this.email = this.email + "</table><br><br>";
	this.email = this.email + $L("Sent from") + " <a href='http://developer.palm.com/appredirect/?packageid=" + Mojo.Controller.appInfo.id + "'>Free Music Ringtones for webOS</a>"
	
	//--> Da email, Da email!
	palm.sendemail(this, this.subject, this.email);
}
FavoritesAssistant.prototype.resultTapListener = function(event){
	if (this.count > 0){
		if (this.filtered){
			this.controller.stageController.pushScene("songs", {index: this.listFilterFindOriginal(event.index, this.subset[event.index].artistName, this.subset[event.index].trackName, this.subset[event.index].collectionName), songs: this.resultModel.items, country: "", source:this.params.action});
		}else{
			this.controller.stageController.pushScene("songs", {index: event.index, songs: this.resultModel.items, country: "", source:this.params.action});
		}
	}
}
FavoritesAssistant.prototype.scrubName = function(track, artist){
	return replaceAll(track, " - " + artist, "")
}
FavoritesAssistant.prototype.handleSelectorPill = function(a){
	var favOptions = [
		{command:"favorites", label:$L("Favorites")},
		{command:"downloaded", label:$L("Downloaded")}
	];
	this.controller.popupSubmenu({
		onChoose: this.handleSelectorPillSelected.bind(this), placeNear: this.controller.get("selectorPillSource"), items: favOptions
	});
}
FavoritesAssistant.prototype.handleSelectorPillSelected = function(a){
	//--> Check if no option was chosena nd use current one instead.
	if (String(a)!="undefined"){
		//--> See if tab was changed
		if (a != this.params.action){
			//--> Set our action
			this.params.action = a
			
			//--> Do Header
			if (this.params.action=="downloaded"){
				this.controller.get("selectorPillSelection").innerHTML = $L("Downloaded");
				this.controller.get("title").innerHTML = $L("Downloaded");
			}else{
				this.controller.get("selectorPillSelection").innerHTML = $L("Favorites");
				this.controller.get("title").innerHTML = $L("Favorites");
			}
			
			this.doSearch();
			this.updateInfo("handleClear with this.params.action = " + this.params.action);
			this.handleClear();
		}
	}
}
FavoritesAssistant.prototype.scrubRank = function(name, rank){
	return Right(name, (name.length - (rank.length + 2)))
}
FavoritesAssistant.prototype.testExist = function(file, id){
	//--> Uses an AJAX request to see if the file is already downloaded. If so, disable/update the download option
	this.fileExistCheckRequest = new Ajax.Request(file, {
		method: 'get',
		onFailure: function(){
			//--> Nope, does not exist...
			this.updateInfo("ringtoneCheck NOT EXISTS: " + file);
			this.testExistRemove(id);
		}.bind(this),
		on0: function(){
			//--> Nope, does not exist...
			this.updateInfo("ringtoneCheck [0] NOT EXISTS: " + file);
			this.testExistRemove(id);
		}.bind(this)
	});
}
FavoritesAssistant.prototype.testExistRemove = function(id){
	this.updateInfo("Removing Item: " + id);
	/*
	FreeRingtones.Database.transaction( 
		(function (transaction) {
			transaction.executeSql("DELETE FROM tblDownloads WHERE dlID = " + id + "", []);
			Mojo.Log.info("*** --> Ringtone removed from Downloads");
		}).bind(this) 
	);
	*/
}
FavoritesAssistant.prototype.listFilterHandler = function(filterString, listWidget, offset, count){
	//this.updateInfo("GOT listFilterHandler EVENT IN CLIENT, str=" + filterString + " on " + this.resultModel.items.length + " items");

	this.subset = [];
	var totalSubsetSize = 0;
	var lowerString = filterString.toLowerCase();
	var lowerName = "";
	var offset = 0;
	
	//loop through the original data set & get the subset of items that have the filterstring 
	var i = 0;
	while (i < this.resultModel.items.length){
		lowerArtist = this.resultModel.items[i].artistName.toLowerCase();
		lowerSong = this.resultModel.items[i].trackName.toLowerCase();
		
		if (lowerArtist.include(lowerString) || lowerSong.include(lowerString) || filterString == ""){
			//if (this.subset.length < count && totalSubsetSize >= offset){
				this.subset.push(this.resultModel.items[i]);
			//}
			totalSubsetSize++;
		}
		i++;
	}
	
	//--> Update the items in the list with the subset
	listWidget.mojo.noticeUpdatedItems(offset, this.subset);
	
	//--> Set the list's length & count if we're not repeating the same filter string from an earlier pass
	if (this.filter !== filterString){
		listWidget.mojo.setLength(totalSubsetSize);
		listWidget.mojo.setCount(totalSubsetSize);
	}
	this.filter = filterString;
}
FavoritesAssistant.prototype.listFilter = function(event){
	//this.updateInfo("GOT FILTER EVENT IN CLIENT, str=" + event.filterString);
	if (event.filterString!=""){
		this.filtered = true;
		$("brandHeader").style.display = "none";
		$("brandHeaderSpacer").style.display = "none";
	}else{
		this.filtered = false;
		$("brandHeader").style.display = "";
		$("brandHeaderSpacer").style.display = "";
	}
}
FavoritesAssistant.prototype.listFilterFindOriginal = function(newIndex, newArtist, newSong, newAlbum){
	for (var i = 0; i < this.resultModel.items.length; i++){
		if (newArtist == this.resultModel.items[i].artistName && newSong == this.resultModel.items[i].trackName && newAlbum == this.resultModel.items[i].collectionName){
			return i;	
		}
	}
}
FavoritesAssistant.prototype.scrubBadParts = function(data){
	try{
		if (data == null || data == ""){
			this.updateInfo("SCRUBBING: No Data");
			return "";
			break;
		}
		
		//--> Look for " - Single" in name
		data = Trim(replaceAll(data, " - Single", ""));
		
		//--> Look for {} in name
		var m = data.match(/\{(.*)\}/);
		if (m == null){
			//--> Do nothing
		}else{
			if (m[0] == ""){
				var tag = m[0];
			}else{
				var tag = m[1];
			}
			
			this.updateInfo("1.) SCRUBBING: Found: " + tag);
			data = Trim(replaceAll(data, "{" + tag + "}", ""));
		}
		
		
		//--> Look for [] in name
		var m = data.match(/\[(.*)\]/);
		if (m == null){
			//--> Do nothing
		}else{
			if (m[0] == ""){
				var tag = m[0];
			}else{
				var tag = m[1];
			}
			
			this.updateInfo("2.) SCRUBBING: Found: " + tag);
			data = Trim(replaceAll(data, "[" + tag + "]", ""));
		}
	
		//--> Look for () in name
		var m = data.match(/\((.*)\)/);
		if (m == null){
			//--> Do nothing
		}else{
			if (m[0] == ""){
				var tag = m[0];
			}else{
				var tag = m[1];
			}
			
			this.updateInfo("3.) SCRUBBING: Found: " + tag);
			data = Trim(replaceAll(data, "(" + tag + ")", ""));
		}
	}catch(e){
		this.updateInfo("Scrub Error: " + e);
	}
	
	return data
}
FavoritesAssistant.prototype.clearRecords = function(){
	this.updateInfo("Called: clearRecords");

	if (this.params.action=="downloaded"){
		//this.commandMenuModel.items[0].disabled = true;
		//this.controller.modelChanged(this.commandMenuModel, this);
		this.controller.stageController.pushScene("helpdetails", "helpManageRingtones");
	}else{
		try{
			this.controller.showAlertDialog({
				onChoose: function(value){
					if (value=="yes"){
						this.updateInfo("Called: clearRecords {yes}");
						FreeRingtones.Database.transaction(
							(function(transaction){
								transaction.executeSql("DELETE FROM tblFavorites WHERE favID > 0");
								this.doSearch();
								this.updateInfo("Called: clearRecords {yes, finished}");
							}).bind(this)
						);
					}
				},
				preventCancel: false,
				title: $L("Clear Favorites?"),
				message: $L("Are you sure you want to delete all favorites?"),
				choices:[
					{label:$L('Yes'), value:"yes", type:'affirmative'},
					{label:$L('No'), value:"no", type:'negative'}
				]
			});
		}catch(e){
			//--> Error?
		}

	}

}
