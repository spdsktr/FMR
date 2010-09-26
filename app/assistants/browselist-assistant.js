function BrowselistAssistant(params){
	this.params = params;
	this.filtered = false;
	this.subset = [];
}
BrowselistAssistant.prototype.setup = function(){
	//--> Launch the default App Menu
	this.controller.setupWidget(Mojo.Menu.appMenu, FreeRingtones.MenuAttr, FreeRingtones.MenuModel);
	
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
	
	//--> Set the name of the List
	this.controller.get("title").innerHTML = this.params.name;
	
	//--> Define Listeners
	Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bind(this));
	Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.filterImmediate, this.listFilter.bind(this));
	
	//--> Do we go ahead with the search?
	this.doSearch();
}
BrowselistAssistant.prototype.activate = function(event){
}
BrowselistAssistant.prototype.deactivate = function(event){
}
BrowselistAssistant.prototype.cleanup = function(event){
	Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bind(this));
	Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.filterImmediate, this.listFilter.bind(this));
}
BrowselistAssistant.prototype.updateInfo = function(data){
	Mojo.Log.info("*** --> " + data);
	if (FreeRingtones.doInfo){
		this.controller.get("info").innerHTML = this.controller.get("info").innerHTML + data + "<br>";
	}
}
BrowselistAssistant.prototype.doSearch = function(){
	//--> Check the Internet Connection
	this.updateInfo("doSearch starting: " + "json/" + this.params.filename);
	new Ajax.Request("json/" + this.params.filename, {
		method: 'get',
		evalJS: false,
		evalJSON: 'force',
		onSuccess: this.searchSuccess.bind(this),
		onFailure: this.searchFailure.bind(this)
	});
}
BrowselistAssistant.prototype.searchFailure = function(result) {
	Mojo.Controller.errorDialog("There was an error performing this search. Check your connection and try again.");
}
BrowselistAssistant.prototype.searchSuccess = function(result){
	//--> Stop the Search Button Spinner
	this.songs = result.responseText.evalJSON();
	//this.songs = fileCheck.scrubInvalids(result.responseText.evalJSON());
	this.countRecords = this.songs.resultCount;
	
	if (this.countRecords == 0){
		Mojo.Controller.errorDialog("There were no results for your search. Please try again.");
	}else{
		//--> Show the results area
		this.controller.get('results').style.display = "";

		this.controller.get("resultsnumber").innerHTML = this.countRecords;
		this.resultModel.items = this.songs.results;
	}
	
	this.controller.modelChanged(this.resultModel, this);

	//--> Do the background cover artwork
	bg.assignCovers(this, this.resultModel.items);
}
BrowselistAssistant.prototype.resultTapListener = function(event){
	if (this.countRecords > 0){
		if (this.filtered){
			this.controller.stageController.pushScene("songs", {index: this.listFilterFindOriginal(event.index, this.subset[event.index].artistName, this.subset[event.index].trackName, this.subset[event.index].collectionName), songs: this.resultModel.items, country: "", source:"browse"});
		}else{
			this.controller.stageController.pushScene("songs", {index: event.index, songs: this.resultModel.items, country: "", source:"browse"});
		}
	}
}
BrowselistAssistant.prototype.listFilterHandler = function(filterString, listWidget, offset, count){
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
BrowselistAssistant.prototype.listFilter = function(event){
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
BrowselistAssistant.prototype.listFilterFindOriginal = function(newIndex, newArtist, newSong, newAlbum){
	for (var i = 0; i < this.resultModel.items.length; i++){
		if (newArtist == this.resultModel.items[i].artistName && newSong == this.resultModel.items[i].trackName && newAlbum == this.resultModel.items[i].collectionName){
			return i;	
		}
	}
}
