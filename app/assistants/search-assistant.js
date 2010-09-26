function SearchAssistant(params){
	this.params = params;
	this.limit = 100;
	this.filtered = false;
	this.subset = [];
}
SearchAssistant.prototype.setup = function(){
	//--> Launch the default App Menu
	this.controller.setupWidget(Mojo.Menu.appMenu, FreeRingtones.MenuAttr, FreeRingtones.MenuModel);
	
	//--> Check database connection
	if (FreeRingtones.Database==null){
		this.updateInfo("Setting up database connection");
		sql.dbConnection.bind(this);
	}
	
	try{
		this.countRecords = 0;
	
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
				spinning: false
			}
		);

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
				 value: this.params.srchTerms,
				 disabled: false
			 }
		);

		//--> Setup the Bottom menu for next/prev/rand
		this.commandMenuModel = {
			items: [
				{
					label:			"<span style='" + FreeRingtones.labelstyles + "'>" + $L("100 Results") + "</span>",
					command:		"top100",
					submenu:		"submenua"
				},
				{},
				{
					label:			"<span style='" + FreeRingtones.labelstyles + "'>" + $L("Top of Page") + "</span>",
					command:		"topofpage",
				}
			]
		};
		this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'my-scene-fade-bottom'}, this.commandMenuModel);

		//--> Setup our Sub Menu for Options
		this.subMenuModelA = {
			label: $L('100 Results'),
			items: [
					{label: $L('100 Results'), command:'limit100', disabled: false},
					{label: $L('200 Results'), command:'limit200', disabled: false},
					{label: $L('300 Results'), command:'limit300', disabled: false}
			]
		};
		this.controller.setupWidget('submenua', undefined, this.subMenuModelA);

		//--> Define Listeners
		Mojo.Event.listen(this.controller.get("searchbutton"), Mojo.Event.tap, this.doSearch.bind(this));	 
		Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.listTap, this.tapHandler.bind(this));
		Mojo.Event.listen(this.controller.get("search-all"), Mojo.Event.tap, this.setSearchType.bind(this, "all"));
		Mojo.Event.listen(this.controller.get("search-song"), Mojo.Event.tap, this.setSearchType.bind(this, "song"));
		Mojo.Event.listen(this.controller.get("search-artist"), Mojo.Event.tap, this.setSearchType.bind(this, "artist"));
		Mojo.Event.listen(this.controller.get("search-album"), Mojo.Event.tap, this.setSearchType.bind(this, "album"));
		Mojo.Event.listen(this.controller.get("search-country"), Mojo.Event.tap, this.setSearchCountry.bind(this, "album"));
		Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.filterImmediate, this.listFilter.bind(this));
		
		try{
			this.controller.get("loadSpinner").mojo.stop(); //stop da spinnaz!
		}catch(e){}

		
		//--> Was a type passed along?
		if (this.params.srchType != ""){
			FreeRingtones.SearchType = this.params.srchType;
		}
		if (this.params.srchCountry != ""){
			FreeRingtones.SearchCountry = this.params.srchCountry;
		}else{
			FreeRingtones.SearchCountry = ckPrefs.ckSearchCountry;
		}
		if (String(this.params.srchCountry) == "undefined"){
			this.params.srchCountry = "us";
			FreeRingtones.SearchCountry = "us";
		}
		this.updateInfo("this.params.srchCountry = " + this.params.srchCountry);
		this.updateInfo("FreeRingtones.SearchCountry = " + FreeRingtones.SearchCountry);

		//--> Do localization
		//this.controller.get("noresults").innerHTML = $L("Search for Ringtones");
		this.controller.get("search-select").innerHTML = $L("Search:");
		this.controller.get("search-all").innerHTML = $L("All");
		this.controller.get("search-song").innerHTML = $L("Song");
		this.controller.get("search-artist").innerHTML = $L("Artist");
		this.controller.get("search-album").innerHTML = $L("Album");
		//this.controller.get("search-country").innerHTML = $L("Country: ") + UCase(FreeRingtones.SearchCountry);
		this.setSearchCountryText();
		this.updateInfo("DIV: " + $L("Country: ") + UCase(FreeRingtones.SearchCountry))

		//--> Do we go ahead with the search?	
		if (this.params.srchDo && this.searchModel.value != ""){
			this.doSearch();
		}else{
			try{
				this.controller.get("loadSpinner").mojo.stop(); //stop da spinnaz!
			}catch(e){}
		}
		this.setSearchType(FreeRingtones.SearchType)
	}catch(e){
		this.updateInfo("Setup Error: " + e);	
	}
}
SearchAssistant.prototype.activate = function(event){
	this.useKeyEnterSearch = this.useKeySearch.bind(this);
	Mojo.Event.listen(this.controller.document, "keydown", this.useKeyEnterSearch, true);
}
SearchAssistant.prototype.deactivate = function(event){
	try{
		Mojo.Event.stopListening(this.controller.document, "keydown", this.useKeyEnterSearch, true);
	}catch(e){}
}
SearchAssistant.prototype.cleanup = function(event){
	try{
		Mojo.Event.stopListening(this.controller.get("searchbutton"), Mojo.Event.tap, this.doSearch.bind(this));	 
		Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.listTap, this.tapHandler.bind(this));
		Mojo.Event.stopListening(this.controller.get("search-all"), Mojo.Event.tap, this.setSearchType.bind(this, "all"));
		Mojo.Event.stopListening(this.controller.get("search-song"), Mojo.Event.tap, this.setSearchType.bind(this, "song"));
		Mojo.Event.stopListening(this.controller.get("search-artist"), Mojo.Event.tap, this.setSearchType.bind(this, "artist"));
		Mojo.Event.stopListening(this.controller.get("search-album"), Mojo.Event.tap, this.setSearchType.bind(this, "album"));
		Mojo.Event.stopListening(this.controller.get("search-country"), Mojo.Event.tap, this.setSearchCountry.bind(this, "album"));
		Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.filterImmediate, this.listFilter.bind(this));
	}catch(e){}
}
SearchAssistant.prototype.updateInfo = function(data){
	Mojo.Log.info("*** --> " + data);
	if (FreeRingtones.doInfo){
		this.controller.get("info").innerHTML = this.controller.get("info").innerHTML + data + "<br>";
	}
}
SearchAssistant.prototype.setSearchType = function(opt){
	try{
		this.updateInfo("Search Type: " + opt);
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
		this.controller.modelChanged(this.searchModel, this);
		
		//this.controller.get("searchterm").focus();
		//this.controller.get("searchterm").setCursorPosition(1, 100);
		this.searchAttr.focus = true;
	}catch(e){
		this.updateInfo("setSearchType Error: " + e)	;
	}
}
SearchAssistant.prototype.setSearchCountry = function(opt){
	this.controller.popupSubmenu({
		onChoose: this.setSearchCountrySelected.bind(this), placeNear: this.controller.get("search-country"), items: iTunesCountries
	});
}
SearchAssistant.prototype.setSearchCountrySelected = function(a){
	this.updateInfo("Selected: " + a);

	if (a != "" && String(a) != "undefined"){
		for (var c = 0; c < iTunesCountries.length; c++){
			if (a == iTunesCountries[c].command){
				var countryCode = LCase(iTunesCountries[c].countryCode);
			}
		}
		
		ckPrefs.ckSearchCountry = countryCode;
		preferences.save(FreeRingtones.Cookie, ckPrefs);
	
		FreeRingtones.SearchCountry = countryCode;
		//this.controller.get("search-country").innerHTML = $L("Country: ") + UCase(FreeRingtones.SearchCountry);
		this.setSearchCountryText();
	}
}
SearchAssistant.prototype.setSearchCountryText = function(){
	for (var c = 0; c < iTunesCountries.length; c++){
		if (LCase(FreeRingtones.SearchCountry) == LCase(iTunesCountries[c].countryCode)){
			this.controller.get("search-country").innerHTML = $L("Country") + ":<br>" + iTunesCountries[c].label;
		}
	}
}

SearchAssistant.prototype.doSearch = function(){
	//--> Check the Internet Connection
	//this.checkConnection();
	
	//mixTerm, genreIndex, artistTerm,
	//composerTerm, albumTerm,
	//ratingIndex, songTerm,
	//musicTrackTerm
	try{
		this.controller.get("loadSpinner").mojo.start(); //start da spinnaz!
	}catch(e){
		this.updateInfo("Spinner error: " + e);
	}
	
	//--> Double Check Country...
	if (FreeRingtones.SearchCountry == ""){
		FreeRingtones.SearchCountry = "us";
	}
	
	if (this.searchModel.value == ""){
		Mojo.Controller.errorDialog($L("Please enter a search term."));
	}else{
		this.url = "http://ax.phobos.apple.com.edgesuite.net/WebObjects/MZStoreServices.woa/wa/wsSearch?limit=" + this.limit + "&media=music&entity=musicTrack&country="+FreeRingtones.SearchCountry+"&term="+this.searchModel.value
		if (FreeRingtones.SearchType == "song"){
			this.url = this.url + "&attribute=musicTrackTerm";
		}else if (FreeRingtones.SearchType == "artist"){
			this.url = this.url + "&attribute=artistTerm";
		}else if (FreeRingtones.SearchType == "album"){
			this.url = this.url + "&attribute=albumTerm";
		}else if (FreeRingtones.SearchType == "video"){
			this.url = this.url + "&attribute=musicVideo";
		}else if (FreeRingtones.SearchType == "mix"){
			this.url = this.url + "&attribute=mixTerm";
		}
		this.updateInfo("URL: " + this.url)
		new Ajax.Request(this.url, {
			method: 'get',
			evalJS: false,
			evalJSON: 'force',
			onSuccess: this.searchSuccess.bind(this),
			onFailure: this.searchFailure.bind(this),
			on404: this.searchFailure.bind(this),
			on500: this.searchFailure.bind(this)
		});
		
		this.controller.get("title").innerHTML = $L("Search") + ": " + this.searchModel.value;
	}
}
SearchAssistant.prototype.searchFailure = function(result){
	//--> Da spinnaz!
	this.controller.get("loadSpinner").mojo.stop(); //start da spinnaz!

	Mojo.Controller.errorDialog($L("There was an error performing this search. Check your connection and try again."));
}
SearchAssistant.prototype.searchSuccess = function(result){
	this.songs = fileCheck.scrubInvalids(result.responseText.evalJSON());
	//this.songs = result.responseText.evalJSON();
	this.countRecords = this.songs.resultCount;

	//--> Da spinnaz!
	this.controller.get("loadSpinner").mojo.stop(); //start da spinnaz!

	if (this.countRecords == 0){
		Mojo.Controller.errorDialog($L("There were no results for your search. Please try again."));
	}else{
		//--> Show the results area
		this.controller.get('results').style.display = "";

		this.controller.get("resultsnumber").innerHTML = this.countRecords;
		this.resultModel.items = this.songs.results;
	}
	
	this.controller.modelChanged(this.resultModel, this);
}
SearchAssistant.prototype.tapHandler = function(event){
	if (this.countRecords > 0){
		if (this.filtered){
			this.controller.stageController.pushScene("songs", {index: this.listFilterFindOriginal(event.index, this.subset[event.index].artistName, this.subset[event.index].trackName, this.subset[event.index].collectionName), songs: this.resultModel.items, source:"search", country: FreeRingtones.SearchCountry});
		}else{
			this.controller.stageController.pushScene("songs", {index: event.index, songs: this.resultModel.items, source:"search", country: FreeRingtones.SearchCountry});
		}
	}
}
SearchAssistant.prototype.useKeySearch = function(evKey){
	if (evKey.keyCode == Mojo.Char.enter){
		this.doSearch();
	}
}
SearchAssistant.prototype.handleCommand = function(event){
	if(event.type == Mojo.Event.command){
		switch(event.command){
			case "limit100":
				this.limit = 100;
				this.commandMenuModel.items[0].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("100 Results") + "</span>";
				this.controller.modelChanged(this.commandMenuModel, this);
				this.doSearch();
				break;
			case "limit200":
				this.limit = 200;
				this.commandMenuModel.items[0].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("200 Results") + "</span>";
				this.controller.modelChanged(this.commandMenuModel, this);
				this.doSearch();
				break;
			case "limit300":
				this.limit = 300;
				this.commandMenuModel.items[0].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("300 Results") + "</span>";
				this.controller.modelChanged(this.commandMenuModel, this);
				this.doSearch();
				break;
			case "limit400":
				this.limit = 400;
				this.commandMenuModel.items[0].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("400 Results") + "</span>";
				this.controller.modelChanged(this.commandMenuModel, this);
				this.doSearch();
				break;
			case "limit500":
				this.limit = 500;
				this.commandMenuModel.items[0].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("500 Results") + "</span>";
				this.controller.modelChanged(this.commandMenuModel, this);
				this.doSearch();
				break;
			case "topofpage":
				Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();
				break;
			case 'grid':
				this.showGrid();
				break;
			case 'list':
				this.showList();
				break;
			case 'top':
				Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();
				break;
			default:
				//Mojo.Controller.errorDialog("Received command that I did not understand: " + event.command);
			break;
		}
	}
}
SearchAssistant.prototype.listFilterHandler = function(filterString, listWidget, offset, count){
	this.updateInfo("GOT listFilterHandler EVENT IN CLIENT, str=" + filterString + " on " + this.resultModel.items.length + " items");

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
SearchAssistant.prototype.listFilter = function(event){
	this.updateInfo("GOT FILTER EVENT IN CLIENT, str=" + event.filterString);
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
SearchAssistant.prototype.listFilterFindOriginal = function(newIndex, newArtist, newSong, newAlbum){
	for (var i = 0; i < this.resultModel.items.length; i++){
		if (newArtist == this.resultModel.items[i].artistName && newSong == this.resultModel.items[i].trackName && newAlbum == this.resultModel.items[i].collectionName){
			return i;	
		}
	}
}


/*

SearchAssistant.prototype.showList = function(event){
	//--> Hide Grid
	this.controller.get("resultsGrid").style.display = "none";
	this.controller.get("resultslist").style.display = "";
}
SearchAssistant.prototype.showGrid = function(event){
	//--> Hide List
	this.controller.get("resultsGrid").style.display = "";
	this.controller.get("resultslist").style.display = "none";
	
	this.controller.get("resultsGrid").innerHTML = "<table width='100%' border='0' cellspacing='0' cellpadding='0'><tr><td>";

	for (var i = 0; i < this.songs.resultCount; i++){

		if (i%3==1){
			this.controller.get("resultsGrid").innerHTML = this.controller.get("resultsGrid").innerHTML	+ "<tr>"
		}

		this.controller.get("resultsGrid").innerHTML = this.controller.get("resultsGrid").innerHTML + "<td align=center><img src='" + this.songs.results[i].artworkUrl60 + "' width=45 height=45 class='gridImg' align=center /><span class='grinText'>" + this.songs.results[i].artistName + "</span></td>";
		
		if (i%3==3){
			this.controller.get("resultsGrid").innerHTML = this.controller.get("resultsGrid").innerHTML	+ "</tr>"
		}
		
		//this.controller.get("songtrack").innerHTML = this.scrubRank(this.songs.trackName);
		//this.controller.get("songartist").innerHTML = this.songs.artistName;
		//this.controller.get("songalbum").innerHTML = this.songs.collectionName;
		//this.controller.get("songgenre").innerHTML = this.songs.primaryGenreName;
		//this.controller.get("songcover").src = this.songs.artworkUrl100;
	}

	this.controller.get("resultsGrid").innerHTML = "</tr></table>"
}
*/