function BrowseAssistant(params){
	this.params = params;
}
BrowseAssistant.prototype.setup = function(){
	//--> Launch the default App Menu
	this.controller.setupWidget(Mojo.Menu.appMenu, FreeRingtones.MenuAttr, FreeRingtones.MenuModel);
	
	this.countRecords = 0;
	
	//--> Results List
	this.controller.setupWidget("resultslist",
        this.resultAttr = {
			itemTemplate: "browse/rowTemplate",
			listTemplate: "browse/listTemplate",
            swipeToDelete: false,
            reorderable: false
         },
         this.resultModel = {
             items : []
          }
    ); 
	
	//--> Define Listeners
	Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bind(this));
	
	//--> Do search
	this.doSearch();
}
BrowseAssistant.prototype.activate = function(event){
}
BrowseAssistant.prototype.deactivate = function(event){
}
BrowseAssistant.prototype.cleanup = function(event){
	Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bind(this));
}
BrowseAssistant.prototype.updateInfo = function(data){
	Mojo.Log.info("*** --> " + data);
	if (FreeRingtones.doInfo){
		this.controller.get("info").innerHTML = this.controller.get("info").innerHTML + data + "<br>";
	}
}
BrowseAssistant.prototype.doSearch = function(){
	//--> Check the Internet Connection
	//this.checkConnection();
	this.updateInfo("Searching Now...");	
	new Ajax.Request("json/browse.json", {
		method: 'get',
		evalJS: false,
		evalJSON: 'force',
		onSuccess: this.searchSuccess.bind(this),
		onFailure: this.searchFailure.bind(this)
	});
}
BrowseAssistant.prototype.searchFailure = function(result) {
	Mojo.Controller.errorDialog("There was an error performing this search. Check your connection and try again.");
}
BrowseAssistant.prototype.searchSuccess = function(result){
	var json = result.responseText.evalJSON();
	this.countRecords = json.resultCount;
	
	if (this.countRecords == 0){
		Mojo.Controller.errorDialog("There were no results for your search. Please try again.");
	}else{
		//--> Show the results area
		this.controller.get('results').style.display = "";

		this.controller.get("resultsnumber").innerHTML = this.countRecords;
		this.resultModel.items = json.results;
	}
	
	this.controller.modelChanged(this.resultModel, this);
}
BrowseAssistant.prototype.resultTapListener = function(event){
	if (this.countRecords > 0){
		this.data = this.resultModel.items[event.index];
		this.controller.stageController.pushScene("browselist", {name: this.data.listname, filename: this.data.filename});
	}
}