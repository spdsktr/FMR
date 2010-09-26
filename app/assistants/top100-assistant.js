function Top100Assistant(params){
	this.params = params;
	
	this.countryName = "USA";
	this.countryITunes = 143441;
	this.countryCode = "us";
	this.genre = "0";
	this.limit = 100;
	this.count = 0;
	this.filtered = false;
	this.subset = [];
}
Top100Assistant.prototype.setup = function(){
	//--> Launch the default App Menu
	this.controller.setupWidget(Mojo.Menu.appMenu, FreeRingtones.MenuAttr, FreeRingtones.MenuModel);
	
	//--> Update the header
	this.controller.get("title").innerHTML = "Top " + this.limit + ": " + $L(this.countryName);

	//--> Results List
	this.controller.setupWidget("resultslist",
        this.resultAttr = {
			itemTemplate: "search/rowTemplate",
			listTemplate: "search/listTemplate",
			filterFunction: this.listFilterHandler.bind(this),
			delay: 500,
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

	//--> Setup the Bottom menu for next/prev/rand
	this.commandMenuModel = {
		items: [
			{
				label:			"<span style='" + FreeRingtones.labelstyles + "'>Top 100</span>",
				command:		"top100",
				submenu:		"submenua"
			},
			{},
			{
				command:		"genre",
				label:			"<span style='" + FreeRingtones.labelstyles + "'>Genre: All</span>",
				submenu:		"submenub"
			}
		]
	};
	this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'my-scene-fade-bottom'}, this.commandMenuModel);

	//--> Setup our Sub Menu for Options
	this.subMenuModelA = {
		label: $L('Top 100'),
		items: [
				{label: $L('Top 100'), command:'limittop100', disabled: false},
				{label: $L('Top 200'), command:'limittop200', disabled: false},
				{label: $L('Top 300'), command:'limittop300', disabled: false}
		]
	};
	this.controller.setupWidget('submenua', undefined, this.subMenuModelA);

	//--> Setup our Sub Menu for Options
	this.subMenuModelB = {
		label: $L('Genre'),
		items: [
				{label: $L('All Genres'), command:'allgenres', disabled: false}
		]
	};
	this.controller.setupWidget('submenub', undefined, this.subMenuModelB);

	//--> Define Listeners
	Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bind(this));
	Mojo.Event.listen(this.controller.get("selectorPillHit"), Mojo.Event.tap, this.handleSelectorPill.bind(this)); 
	Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.filterImmediate, this.listFilter.bind(this));

	try{
		if (ckPrefs.ckTopCountyCode != "" && ckPrefs.ckTopCountyName != "" && ckPrefs.ckTopCountyItunes != ""){
			this.countryName = ckPrefs.ckTopCountyName;
			this.countryITunes = ckPrefs.ckTopCountyItunes;
			this.countryCode = ckPrefs.ckTopCountyCode;
			
			this.controller.get("selectorPillSelection").innerHTML = this.countryName;
			
			this.doCountry();
		}

		if (ckPrefs.ckTopCountyGenre != ""){
			this.updateInfo("ckPrefs.ckTopCountyGenre = " + ckPrefs.ckTopCountyGenre);
			this.genre = ckPrefs.ckTopCountyGenre;
			this.doGenre();
		}
	}catch(e){
		this.updateInfo("Top100Assistant Cookie Error: " + e);
	}

	//--> Do we go ahead with the search?	
	this.doSearch();
	this.doCountry();
}
Top100Assistant.prototype.activate = function(event){
}
Top100Assistant.prototype.deactivate = function(event){
}
Top100Assistant.prototype.cleanup = function(event){
	Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bind(this));
	Mojo.Event.stopListening(this.controller.get("selectorPillHit"), Mojo.Event.tap, this.handleSelectorPill.bind(this)); 
	Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.filterImmediate, this.listFilter.bind(this));
}
Top100Assistant.prototype.handleCommand = function(event){
    if(event.type == Mojo.Event.command){
		this.updateInfo("Command: " + event.command);
        switch(event.command){
			case "limittop100":
				this.limit = 100;
				this.commandMenuModel.items[0].label = "<span style='" + FreeRingtones.labelstyles + "'>Top 100</span>";
				this.controller.modelChanged(this.commandMenuModel, this);
				this.doSearch();
				break;
			case "limittop200":
				this.limit = 200;
				this.commandMenuModel.items[0].label = "<span style='" + FreeRingtones.labelstyles + "'>Top 200</span>";
				this.controller.modelChanged(this.commandMenuModel, this);
				this.doSearch();
				break;
			case "limittop300":
				this.updateInfo("### Running 300");
				this.limit = 300;
				this.commandMenuModel.items[0].label = "<span style='" + FreeRingtones.labelstyles + "'>Top 300</span>";
				this.controller.modelChanged(this.commandMenuModel, this);
				this.updateInfo("Command 300 Command? Then search?")
				this.doSearch();
				break;
			case "allgenres":
				//this.genre = "";
				this.commandMenuModel.items[2].label = "<span style='" + FreeRingtones.labelstyles + "'>All Genres</span>";
				this.controller.modelChanged(this.commandMenuModel, this);
				this.doSearch();
				break;
			default:
				if (event.command != "" && event.command != "limittop100" && event.command != "limittop200" && event.command != "limittop300" && event.command != "allgenres"){
					this.updateInfo("Command Running Default: " + event.command)
					this.genre = event.command;
					this.doGenre();
					this.doSearch();
					break;
				}
			break;
		}
	}
}
Top100Assistant.prototype.updateInfo=function(data){
	Mojo.Log.info("*** --> " + data);
	if (FreeRingtones.doInfo){
		this.controller.get("info").innerHTML = this.controller.get("info").innerHTML + data + "<br>";
	}
}
Top100Assistant.prototype.doSearch = function(){
	try{
		this.controller.get("loadSpinner").mojo.start(); //start da spinnaz!
	}catch(e){
		this.updateInfo("Spinner error: " + e);
	}

	//--> Update the header & results
	this.controller.get("results").style.display = "none";
	this.controller.get("title").innerHTML = "Top " + this.limit + ": " + $L(this.countryName);

	//--> Reset the model
	this.resultModel.items = [];
	this.controller.modelChanged(this.resultModel, this);

	this.updateInfo("### Genre is Now: " + this.genre);
	//this.url = "http://ax.phobos.apple.com.edgesuite.net/WebObjects/MZStore.woa/wpa/MRSS/topsongs/sf=" + this.countryITunes + "/limit=" + this.limit + "/rss.xml";
	this.url = "http://ax.phobos.apple.com.edgesuite.net/WebObjects/MZStore.woa/wpa/MRSS/topsongs/sf=" + this.countryITunes + "/limit=" + this.limit + "";
	if (this.genre!="" && this.genre!="all" && this.genre!="0"){
		this.url = this.url + "/genre=" + this.genre;	
	}
	this.url = this.url + "/rss.xml";
	this.updateInfo(this.url);
	
	//--> Da Ajax Yo
	new Ajax.Request(this.url, {
		method: 'get',
		evalJS: false,
		evalJSON: false,
		onSuccess: this.searchSuccess.bind(this),
		onFailure: this.searchFailure.bind(this),
		on404: this.searchFailure.bind(this),
		on500: this.searchFailure.bind(this)
	});
}
Top100Assistant.prototype.searchFailure = function(result){
	this.controller.get("loadSpinner").mojo.stop(); //stop da spinnaz!
	
	this.controller.showAlertDialog({
		onChoose: function(value){
			//Mojo.Controller.stageController.popScene();
		},
		preventCancel: true,
		title: $L("Error"),
		message: $L("There was an error pulling the Top 100 list. Check your connection and try again."),
		choices:[
			{label:$L('Ok'), value:"ok", type:'dismissal'}
		]
	});
}
Top100Assistant.prototype.searchSuccess = function(transport){
	this.updateInfo("### Running Search Success");
	
	if (transport.responseXML === null && transport.responseText !== null) {
		transport.responseXML = new DOMParser().parseFromString(transport.responseText, 'text/xml');
	}

	//--> Our XML Object
	var xml = transport.responseXML;
	//--> Pull out the song data
	this.items = xml.getElementsByTagName("item");
	
	//--> Da spinnaz!
	this.controller.get("loadSpinner").mojo.stop(); //start da spinnaz!
	
	if (this.items.length == 0){
		//--> See if they really want to 'share' this app
		this.controller.showAlertDialog({
			onChoose: function(value){
				//Mojo.Controller.stageController.popScene();
			},
			preventCancel: true,
			title: $L("Error"),
			message: $L("There were no results in the Top 100 list. Please try a different list."),
			choices:[
				{label:$L('Ok'), value:"ok", type:'dismissal'}
			]
		});
	}else{
		this.count = this.items.length;
		
		//--> Show the results area & # results
		this.controller.get('results').style.display = "";
		this.controller.get("resultsnumber").innerHTML = this.count;

		for (var l = 0; l < this.items.length; l++){
			//this.updateInfo("<b>Processed # " + l + "</b>");
			//this.updateInfo(" --> " + this.items[l].getElementsByTagName("title")[0].childNodes[0].nodeValue + "");
			//this.updateInfo(" --> " + this.items[l].getElementsByTagName("artist")[0].childNodes[0].nodeValue + "");
			//this.updateInfo(" --> " + this.items[l].getElementsByTagName("album")[0].childNodes[0].nodeValue + "");
			//this.updateInfo(" --> " + this.items[l].getElementsByTagName("coverArt")[2].childNodes[0].nodeValue + "");
			//this.updateInfo(" --> " + this.items[l].getElementsByTagName("previewUrl")[0].childNodes[0].nodeValue + "");
			//--> Push it to the model
			if (fileCheck.isValid(this.items[l].getElementsByTagName("previewUrl")[0].childNodes[0].nodeValue)){
				this.resultModel.items.push({
					kind: "song",
					trackName: this.scrubName(this.items[l].getElementsByTagName("title")[0].childNodes[0].nodeValue, this.items[l].getElementsByTagName("artist")[0].childNodes[0].nodeValue),
					artistName: this.items[l].getElementsByTagName("artist")[0].childNodes[0].nodeValue,
					collectionName: this.items[l].getElementsByTagName("album")[0].childNodes[0].nodeValue,
					primaryGenreName: this.items[l].getElementsByTagName("category")[0].childNodes[0].nodeValue,
					artworkUrl60: this.items[l].getElementsByTagName("coverArt")[1].childNodes[0].nodeValue,
					artworkUrl100: this.items[l].getElementsByTagName("coverArt")[2].childNodes[0].nodeValue,
					previewUrl: this.items[l].getElementsByTagName("previewUrl")[0].childNodes[0].nodeValue,
					trackViewUrl: this.items[l].getElementsByTagName("link")[0].childNodes[0].nodeValue,
					rank: this.items[l].getElementsByTagName("rank")[0].childNodes[0].nodeValue
				});
			}
		}
		
		//--> Ensure count is correct
		this.controller.get("resultsnumber").innerHTML = this.resultModel.items.length;
	}
	
	this.controller.modelChanged(this.resultModel, this);
	
	//--> Do the background cover artwork
	bg.assignCovers(this, this.resultModel.items);
}
Top100Assistant.prototype.resultTapListener = function(event){
	if (this.count > 0){
		if (this.filtered){
			this.controller.stageController.pushScene("songs", {index: this.listFilterFindOriginal(event.index, this.subset[event.index].artistName, this.subset[event.index].trackName, this.subset[event.index].collectionName), songs: this.resultModel.items, country: this.countryCode, source:"top100"});
		}else{
			this.controller.stageController.pushScene("songs", {index: event.index, songs: this.resultModel.items, country: this.countryCode, source:"top100"});
		}
	}
}
Top100Assistant.prototype.scrubName = function(track, artist){
	return replaceAll(track, " - " + artist, "")
}
Top100Assistant.prototype.handleSelectorPill = function(a){
	this.controller.popupSubmenu({
		onChoose: this.handleSelectorPillSelected.bind(this), placeNear: this.controller.get("selectorPillSource"), items: iTunesCountries
	});
}
Top100Assistant.prototype.handleSelectorPillSelected = function(a){
	//--> Check if no option was chosena nd use current one instead.
	if (String(a)!="undefined"){
		//--> See if tab was changed
		if (a != this.selectedCountry){
			//--> Set our Country
			this.countryName = a;
			this.updateInfo("Rolling on Country " + a);
			
			//--> Update The Pill Sleector
			//this.controller.get("selectorPillSelection").innerHTML = this.countryName;
			

			//--> Get our iTunesCode
			for (var c = 0; c < iTunesCountries.length; c++){
				if (this.countryName == iTunesCountries[c].command){
					this.countryITunes = iTunesCountries[c].iTunesCode;
					this.countryCode = iTunesCountries[c].countryCode;
					this.countryGenres = iTunesCountries[c].genres;
					this.updateInfo("Found it: " + this.countryCode + ", " + this.countryITunes);
				}
			}
			
			//--> Reset Genre
			this.genre = "0";
			ckPrefs.ckTopCountyGenre = "";
			
			this.doGenre();
			this.doCountry();

			//--> Now do our search...
			this.doSearch();
			
			//--> Show the top of the screen (just in case)
			Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();
		}
	}
}
Top100Assistant.prototype.doCountry = function(){
	this.updateInfo("### Running doCountry");
	//--> Get our iTunesCode
	for (var c = 0; c < iTunesCountries.length; c++){
		if (this.countryName == iTunesCountries[c].command){
			this.countryITunes = iTunesCountries[c].iTunesCode;
			this.countryCode = iTunesCountries[c].countryCode;
			this.countryGenres = iTunesCountries[c].genres;
			this.genre = "";

			ckPrefs.ckTopCountyName = this.countryName;
			ckPrefs.ckTopCountyItunes = this.countryITunes;
			ckPrefs.ckTopCountyCode = this.countryCode;
			
			preferences.save(FreeRingtones.Cookie, ckPrefs);

			//--> Update The Pill Sleector
			this.controller.get("selectorPillSelection").innerHTML = $L(this.countryName);

			//this.updateInfo("Genres: " + JSON.stringify(this.countryGenres));
			
			this.subMenuModelB.items = this.countryGenres;
			this.controller.modelChanged(this.subMenuModelB, this);
			
			this.doGenre();
		}
	}
}
Top100Assistant.prototype.doGenre= function(){
	this.updateInfo("### Running doGenre: " + this.genre);
	
	//--> Get our iTunesCode
	for (var c = 0; c < this.countryGenres.length; c++){
		//this.updateInfo(c + ".) " + this.countryGenres[c].command);
		if (this.genre == this.countryGenres[c].command){
			ckPrefs.ckTopCountyGenre = this.countryGenres[c].command;
			preferences.save(FreeRingtones.Cookie, ckPrefs);

			this.commandMenuModel.items[2].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L(this.countryGenres[c].label) + "</span>";
			this.controller.modelChanged(this.commandMenuModel, this);
		}
	}
}
Top100Assistant.prototype.listFilterHandler = function(filterString, listWidget, offset, count){
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
Top100Assistant.prototype.listFilter = function(event){
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
Top100Assistant.prototype.listFilterFindOriginal = function(newIndex, newArtist, newSong, newAlbum){
	for (var i = 0; i < this.resultModel.items.length; i++){
		if (newArtist == this.resultModel.items[i].artistName && newSong == this.resultModel.items[i].trackName && newAlbum == this.resultModel.items[i].collectionName){
			return i;	
		}
	}
}