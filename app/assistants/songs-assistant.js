function SongsAssistant(params){
	this.params = params;
	this.songs = {};
	this.index = this.params.index;
	this.favID = 0
	this.songfilename = "";
	this.fileExistCheckRequest = null;
}
SongsAssistant.prototype.setup = function() {	
	//--> Launch the default App Menu
	this.controller.setupWidget(Mojo.Menu.appMenu, FreeRingtones.MenuAttr, FreeRingtones.MenuModel);

	//--> Get current Ringtone
	this.ringtoneCurrent();
	
	//--> Audio & Connection variables
	this.audioListen = this.controller.get("audioListen")
	this.audioSetup();
	this.connectionAvailable = true;
	
	//--> Work on our bottom menu
	this.commandMenuModel = {
		items: [
			{
				//icon:			'new',
				iconPath:		"images/icon-play.png",
				command:		"play"
			},
			{
				command:		"download",
				label:			"<span style='" + FreeRingtones.labelstyles + "'>" + $L("Download") + "</span>"
			},
			{
				command:		"set",
				label:			"<span style='" + FreeRingtones.labelstyles + "'>" + $L("Set As Ringtone") + "</span>"
			}
		]
	};
	this.controller.setupWidget(Mojo.Menu.commandMenu, {}, this.commandMenuModel);
	
	this.controller.get("titleCount").innerHTML = (this.index + 1) + " of " + this.params.songs.length;
	
	//--> Set the data
	this.setData();

	//--> Setup card swiping scroller & events
	this.controller.setupWidget("scrollerId", {
			   mode: 'horizontal-snap'
		   }, this.snapmodel = {
			   snapElements: {x: $$('.cardsScrollerItem')},
			   snapIndex: 2
		   }
	);
	this.SnapIt = this.snapped.bindAsEventListener(this, false);

	//--> Results List/Menu Panel
	this.controller.setupWidget("resultslist",
		this.resultAttr = {
			itemTemplate: "search/rowTemplate",
			filterFunction: this.listFilterHandler.bind(this),
			delay: 500,
			swipeToDelete: false,
			reorderable: false
		 },
		 this.resultModel = {
			 items : []
		  }
	);
	this.filterWidget = null;
	this.filterPanel = this.controller.get("menu-panel-container");


	//--> Setup our tap listeners
	Mojo.Event.listen(this.controller.get('scrollerId'), Mojo.Event.propertyChange, this.SnapIt);
	Mojo.Event.listen(this.controller.get('songartist'), Mojo.Event.tap, this.searchArtist.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('songtrack'), Mojo.Event.tap, this.searchTrack.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('songalbum'), Mojo.Event.tap, this.searchAlbum.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('songcover'), Mojo.Event.tap, this.downloadAlbumArtwork.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('titleFavoriteImage'), Mojo.Event.tap, this.btnFavorite.bindAsEventListener(this));


	Mojo.Event.listen(this.controller.get('songamazon'), Mojo.Event.tap, this.btnAmazon.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('songitunes'), Mojo.Event.tap, this.btnItunes.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('songfavorite'), Mojo.Event.tap, this.btnFavorite.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('songlauncher'), Mojo.Event.tap, this.btnLauncher.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get('songyoutube'), Mojo.Event.tap, this.btnYouTube.bindAsEventListener(this));
	//Mojo.Event.listen(this.controller.get('songemail'), Mojo.Event.tap, this.btnEmail.bindAsEventListener(this));
	//Mojo.Event.listen(this.controller.get('songtext'), Mojo.Event.tap, this.btnText.bindAsEventListener(this));


	//Mojo.Event.listen(this.controller.get('diagnoseIssues'), Mojo.Event.tap, this.diagnoseIssues.bindAsEventListener(this));
	Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.filterImmediate, this.listFilter.bind(this));
	//Mojo.Event.listen(this.controller.get("menu-panel-container"), Mojo.Event.filterImmediate, this.listFilter.bind(this));
	Mojo.Event.listen(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bindAsEventListener(this));
	this.filterPanelOff();

	//--> Do our connection alerts
	this.checkConnection();
	
	//--> Localization
	this.controller.get("lblSong").innerHTML = $L("Song");
	this.controller.get("lblArtist").innerHTML = $L("Artist");
	this.controller.get("lblAlbum").innerHTML = $L("Album");
	this.controller.get("lblGenre").innerHTML = $L("Genre");
	this.controller.get("lblCover").innerHTML = $L("Cover");
	
	//--> Show Artist Support Notice
	this.purchaseNoticeShow.bind(this).delay(180);

	if (Mojo.Environment.DeviceInfo.screenHeight < 480){
		this.controller.get("noticeFavorites").style.marginTop = "150px";
		this.controller.get("noticePurchase").style.marginTop = "170px";
	}
}
SongsAssistant.prototype.activate = function(event){
}
SongsAssistant.prototype.deactivate = function(event){
}
SongsAssistant.prototype.cleanup = function(event){
	Mojo.Event.stopListening(this.controller.get('scrollerId'), Mojo.Event.propertyChange, this.SnapIt);
	Mojo.Event.stopListening(this.controller.get('songartist'), Mojo.Event.tap, this.searchArtist.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('songtrack'), Mojo.Event.tap, this.searchTrack.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('songalbum'), Mojo.Event.tap, this.searchAlbum.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('songcover'), Mojo.Event.tap, this.downloadAlbumArtwork.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('titleFavoriteImage'), Mojo.Event.tap, this.btnFavorite.bindAsEventListener(this));
	
	
	Mojo.Event.stopListening(this.controller.get('songamazon'), Mojo.Event.tap, this.btnAmazon.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('songitunes'), Mojo.Event.tap, this.btnItunes.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('songfavorite'), Mojo.Event.tap, this.btnFavorite.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('songlauncher'), Mojo.Event.tap, this.btnLauncher.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get('songyoutube'), Mojo.Event.tap, this.btnYouTube.bindAsEventListener(this));
	//Mojo.Event.stopListening(this.controller.get('songemail'), Mojo.Event.tap, this.btnEmail.bindAsEventListener(this));
	//Mojo.Event.stopListening(this.controller.get('songtext'), Mojo.Event.tap, this.btnText.bindAsEventListener(this));

	//Mojo.Event.stopListening(this.controller.get('songfacebook'), Mojo.Event.tap, this.btnFacebook.bindAsEventListener(this));
	//Mojo.Event.stopListening(this.controller.get('diagnoseIssues'), Mojo.Event.tap, this.diagnoseIssues.bindAsEventListener(this));
	Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.filterImmediate, this.listFilter.bind(this));
	//Mojo.Event.stopListening(this.controller.get("menu-panel-container"), Mojo.Event.filterImmediate, this.listFilter.bind(this));
	Mojo.Event.stopListening(this.controller.get("resultslist"), Mojo.Event.listTap, this.resultTapListener.bindAsEventListener(this));
}
SongsAssistant.prototype.handleCommand = function(event){
	if(event.type == Mojo.Event.command){
		switch(event.command){
			case 'play':
				this.audioPlay();
				break;
			case 'pause':
				this.audioStop();
				break;
			case 'download':
				if (this.fileValid){
					this.ringtoneDownload("noset", 0);
				}else{
					Mojo.Controller.errorDialog("Sorry, but this audio clip is not a valid format for ringtones. Apologies, you can listen to it, but not use as a ringtone.");
				}
				break;
			case 'set':
				if (this.fileValid){
					this.ringtoneDownload("set", 0);
				}else{
					Mojo.Controller.errorDialog("Sorry, but this audio clip is not a valid format for ringtones. Apologies, you can listen to it, but not use as a ringtone.");
				}
				break;
			default:
				//Mojo.Controller.errorDialog("Received command that I did not understand: " + event.command);
			break;
		}
	}
}
SongsAssistant.prototype.updateInfo = function(data){
	Mojo.Log.info("*** --> " + data);
	if (FreeRingtones.doInfo){
		this.controller.get("info").style.display = "";
		this.controller.get("info").innerHTML = this.controller.get("info").innerHTML + data + "<br>";
	}
}
SongsAssistant.prototype.diagnoseIssues = function(){
	this.controller.stageController.pushScene("helpdetails", "helpDiagnose");
}







SongsAssistant.prototype.filterPanelOn = function(){
	this.filterPanel.style.opacity = 1;
}
SongsAssistant.prototype.filterPanelOff = function(){
	this.filterPanel.style.opacity = 0;
	this.subset = [];
}
SongsAssistant.prototype.listFilterHandler = function(filterString, listWidget, offset, count){
	//this.updateInfo("GOT listFilterHandler EVENT IN CLIENT, str=" + filterString + " on " + this.params.songs.length + " items");
	this.filterWidget = listWidget;
	this.subset = [];
	var totalSubsetSize = 0;
	var lowerString = filterString.toLowerCase();
	var lowerName = "";
	var offset = 0;
	
	//loop through the original data set & get the subset of items that have the filterstring 
	var i = 0;
	while (i < this.params.songs.length){
		lowerArtist = this.params.songs[i].artistName.toLowerCase();
		lowerSong = this.params.songs[i].trackName.toLowerCase();
		//lowerAlbum = this.params.songs[i].collectionName.toLowerCase();
		
		if (lowerArtist.include(lowerString) || lowerSong.include(lowerString) || filterString == ""){
			//if (this.subset.length < count && totalSubsetSize >= offset){
				this.subset.push(this.params.songs[i]);
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
SongsAssistant.prototype.listFilter = function(event){
	//this.updateInfo("listFilter Called: " + event.filterString);
	if (event.filterString!=""){
		$("brandHeader").style.display = "none";
		$("brandHeaderSpacer").style.display = "none";
		this.filterPanelOn();
	}else{
		$("brandHeader").style.display = "";
		$("brandHeaderSpacer").style.display = "";
		this.filterPanelOff();
	}
}
SongsAssistant.prototype.resultTapListener = function(event){
	//this.updateInfo("List has been tapped. Original Index: " + this.listFilterFindOriginal(event.index, this.subset[event.index].artistName, this.subset[event.index].trackName, this.subset[event.index].collectionName));
	this.listFilterShow();
	this.index = this.listFilterFindOriginal(event.index, this.subset[event.index].artistName, this.subset[event.index].trackName, this.subset[event.index].collectionName);
	this.setData.bind(this).delay(0.75);
	this.filterWidget.mojo.close();
	$("brandHeader").style.display = "";
	$("brandHeaderSpacer").style.display = "";
	this.filterPanelOff();
	this.subset = [];
}
SongsAssistant.prototype.listFilterFindOriginal = function(newIndex, newArtist, newSong, newAlbum){
	for (var i = 0; i < this.params.songs.length; i++){
		if (newArtist == this.params.songs[i].artistName && newSong == this.params.songs[i].trackName && newAlbum == this.params.songs[i].collectionName){
			return i;	
		}
	}
}
SongsAssistant.prototype.listFilterShow = function(){
	this.controller.get("noticeFilterLoad").className = "noticeFilterLoadShow";
	this.listFilterHide.bind(this).delay(1);
}
SongsAssistant.prototype.listFilterHide = function(){
	this.controller.get("noticeFilterLoad").className = "noticeFilterLoadHide";
}













SongsAssistant.prototype.snapped = function(event){
	//this.updateInfo("Snapped at " + this.snapmodel.snapIndex + ", now resetting");
	if (this.snapmodel.snapIndex != 2){

		//--> Start working on new data
		if (this.snapmodel.snapIndex==0||this.snapmodel.snapIndex==1){
			this.index = this.index - 1;
			if (this.index < 0){
				this.index = this.params.songs.length - 1;
			}
		}else if (this.snapmodel.snapIndex==3||this.snapmodel.snapIndex==4){
			this.index = this.index + 1;
			if (this.index >=  this.params.songs.length){
				this.index = 0;
			}
		}
		
		//--> Reset the download menu
		//this.commandMenuModel.items[1].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("Download") + "</span>";
		this.commandMenuModel.items[2].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("Set As Ringtone") + "</span>";
		this.controller.modelChanged(this.commandMenuModel, this);
		this.controller.get("songcover").src = "images/loading.png";

		//--> Delay the actual snap for a few milliseconds -- impression of feel
		this.snappedDelay.bind(this).delay(0.10, this.snapmodel.snapIndex);

		//this.updateInfo("New Index: " + this.index);
		//this.setData.bind(this).defer();
		this.setData();
	}
}
SongsAssistant.prototype.snappedDelay = function(newIndex){
	this.snapmodel.snapIndex = 2;
	this.controller.modelChanged(this.snapmodel);

	Mojo.View.getScrollerForElement(this.controller.sceneElement).mojo.revealTop();
}
SongsAssistant.prototype.setData = function(){
	//--> Reset the file name(s)
	this.songfilename = "";
	this.fileName = "";

	//--> Pull this item out
	this.songs = this.params.songs[this.index];

	//--> Set the actual fields & Prepare for download Mr. Deville
	//this.updateInfo("Valid File Extension: " + fileCheck.isValid(this.songs.previewUrl));
	this.fileName = this.scrubCharacters(Left(this.songs.artistName + " - " + this.scrubRank(this.songs.trackName), 150)) + "." + fileCheck.ext(this.songs.previewUrl);
	this.fileValid = fileCheck.isValid(this.songs.previewUrl);
	
	if (this.fileValid){
		//--> Now see if it's already downloaded
		this.ringtoneCheck.bind(this).delay(0.10);
	
		//--> See if it is already set
		this.ringtoneCurrentlySet();
	}else{
		this.commandMenuModel.items[1].label = "<span style='color:#FF0000; " + FreeRingtones.labelstyles + "'>" + $L("Not Available") + "</span>";
		//this.commandMenuModel.items[1].disabled = true;
		this.commandMenuModel.items[2].label = "<span style='color:#FF0000; " + FreeRingtones.labelstyles + "'>" + $L("Invalid Format") + "</span>";
		//this.commandMenuModel.items[2].disabled = true;
		this.controller.modelChanged(this.commandMenuModel, this);
	}

	//--> Update Title Count Info
	this.controller.get("titleCount").innerHTML = (this.index + 1) + " of " + this.params.songs.length;
	
	//--> Do da title info
	this.controller.get("titleTrack").innerHTML = this.scrubRank(this.songs.trackName);
	this.controller.get("titleArtist").innerHTML = this.songs.artistName;
	
	//--> Do the card info
	this.controller.get("songtrack").innerHTML = this.scrubRank(this.songs.trackName);
	this.controller.get("songartist").innerHTML = this.songs.artistName;
	this.controller.get("songalbum").innerHTML = this.songs.collectionName;
	this.controller.get("songgenre").innerHTML = this.songs.primaryGenreName;
	this.controller.get("songcover").src = this.songs.artworkUrl100;

	//--> Now do our favorites work
	this.setFavorite.bind(this).defer();

	//--> Prev Album Cover
	if (this.index == 0){
		this.songPrev = this.params.songs[this.params.songs.length-1];
	}else{
		this.songPrev = this.params.songs[this.index-1];
	}
	
	//--> Next Album Cover
	if (this.index >= (this.params.songs.length-1)){
		this.songNext = this.params.songs[0];
	}else{
		this.songNext = this.params.songs[this.index+1];
	}
	
	//--> Set  Album Covers
	try{
		this.controller.get("imgAlbumImage1").src = this.songPrev.artworkUrl100;
	}catch(e){}
	try{
		this.controller.get("imgAlbumImage2").src = this.songs.artworkUrl100;
	}catch(e){}
	try{
		this.controller.get("imgAlbumImage3").src = this.songNext.artworkUrl100;
	}catch(e){}
}
SongsAssistant.prototype.setFavorite = function(){
	//--> Do favorites!
	FreeRingtones.Database.transaction(
		(function(readTransaction){
			var strSQL = "SELECT * FROM tblFavorites WHERE favArtist = '" + sql.fix(this.songs.artistName) + "' AND favSong = '" + sql.fix(this.scrubRank(this.songs.trackName)) + "' AND favAlbum = '" + sql.fix(this.songs.collectionName) + "'";
			//this.updateInfo(strSQL);
			readTransaction.executeSql(strSQL, [], (function(transaction, results){
				//this.updateInfo("Fav check success!")
				if (results.rows.length==0){
					//--> Not a favorite
					this.favID = 0;
					this.controller.get("titleFavoriteImage").style.display = "none";
				}else{
					//--> Its a favorite
					var row = results.rows.item(0);
					this.favID = row["favID"];
					this.controller.get("titleFavoriteImage").style.display = "";
				}		   
			}.bind(this)));
		}).bind(this)
	);
}
SongsAssistant.prototype.ringtoneCheck = function(){
	//--> Uses an AJAX request to see if the file is already downloaded. If so, disable/update the download option
	this.fileExistCheckRequest = new Ajax.Request("/media/internal/" + FreeRingtones.Folder + "/" + this.fileName, {
		method: 'get',
		onSuccess: function(){
			this.updateInfo("ringtoneCheck EXISTS: " + "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName);
			this.ringtoneCheckDownloaded();
			this.dbStoreDownloadCheck();
		}.bind(this),
		onFailure: function(){
			//--> Nope, does not exist...
			this.updateInfo("ringtoneCheck NOT EXISTS: " + "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName);
			this.ringtoneCheckNotDownloaded();
		}.bind(this),
		on0: function(){
			//--> Nope, does not exist...
			this.updateInfo("ringtoneCheck [0] NOT EXISTS: " + "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName);
			this.ringtoneCheckNotDownloaded();
		}.bind(this)
	});
	this.audioAddPlay();
}
SongsAssistant.prototype.ringtoneCheckDownloaded = function(){
	//--> Setup the download option
	this.commandMenuModel.items[1].label = "<span style='color:#009933; " + FreeRingtones.labelstyles + "'>" + $L("Downloaded") + "</span>";
	this.controller.modelChanged(this.commandMenuModel, this);
	
	//--> Store the filename so we do not download again
	this.songfilename = "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName;
	
	//--> Setup Audio
	if (this.commandMenuModel.items[0].command == "play"){
		this.audioPreload(this.songfilename);
	}
	
	//--> Clear the file Obj
	this.fileExistCheckRequest = null
}
SongsAssistant.prototype.ringtoneCheckNotDownloaded = function(){
	this.commandMenuModel.items[1].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("Download") + "</span>";
	this.controller.modelChanged(this.commandMenuModel, this);

	//--> Setup audio (if available)
	if (this.songs.previewUrl != "" && String(this.songs.previewUrl) != "null" && String(this.songs.previewUrl) != "undefined"){
		this.commandMenuModel.items[0].disabled = false;
		this.controller.modelChanged(this.commandMenuModel, this);

		this.audioPreload(this.songs.previewUrl);
	}else{
		this.commandMenuModel.items[0].disabled = true;
		this.controller.modelChanged(this.commandMenuModel, this);
	}
	
	//--> Ensure it is removed
	this.dbStoreDownloadRemove("/media/internal/" + FreeRingtones.Folder + "/" + this.fileName);

	//--> Clear the file Obj
	this.fileExistCheckRequest = null
}
SongsAssistant.prototype.ringtoneDownload = function(action, i){
	try{
		if (this.songfilename == ""){
			this.commandMenuModel.items[1].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("Downloading...") + "</span>";
			this.controller.modelChanged(this.commandMenuModel, this);

			this.controller.serviceRequest("palm://com.palm.downloadmanager/", {
				method:"download",
				parameters: {
					method: "allow1x",
					parameters: {value: true},
					target: this.songs.previewUrl,
					targetFilename: this.fileName,
					targetDir: "/media/internal/" + FreeRingtones.Folder + "/",
					keepFilenameOnRedirect: false,
					subscribe: true
				},
				onSuccess: function(ret){
					if(ret.completed){
						//--> Set the options for it being downloaded
						this.ringtoneCheckDownloaded();
						
						//--> Do we set as a ringtone?
						if(action=="set"){
							this.ringtoneSet("/media/internal/" + FreeRingtones.Folder + "/" + this.fileName);
							//this.messageAlertSet("/media/internal/" + FreeRingtones.Folder + "/" + this.fileName);
						}else if(action=="email"){
							this.updateInfo("Sending email w/ attachment... [" + "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName + "]");
							palm.sendemailwithfile(this, "", this.contents, [{fullPath: "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName}]);
						}else if(action=="text"){
							this.updateInfo("Sending tex w/ attachment... [" + "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName + "]");
							palm.sendtextwithfile(this, this.contents, "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName);
						}else if(action=="sendto"){
							this.updateInfo("Sending To App... [" + "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName + "]");
							this.btnSendtoAppDo();
						}
						
						//--> Save the data in the database
						this.dbStoreDownload();
					}else{
						if (ret.amountReceived > 0 && ret.amountTotal > 0){
							this.commandMenuModel.items[1].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("Download") + " " + Math.round((ret.amountReceived/ret.amountTotal)*100) + "%</span>";
							this.controller.modelChanged(this.commandMenuModel, this);
						}
					}
				}.bind(this),
				onFailure:function(err){
					this.commandMenuModel.items[1].label = "<span style='color:#FF0000; " + FreeRingtones.labelstyles + "'>" + $L("Download Failed") + "</span>";
					this.controller.modelChanged(this.commandMenuModel, this);
					this.err = err;
					
					this.controller.showAlertDialog({
						onChoose: function(value){
							if (value=="help"){
								//--> Do error reporting
								this.controller.stageController.pushScene("helpdetails", "helpDiagnose");
							}
	
						},
						preventCancel: false,
						title: $L("Error"),
						message: $L("There was an error downloading this ringtone") + ": [" + this.fileName + "] " + Object.toJSON(err),
						//message: $L("There was an error downloading this ringtone"),
						choices:[
							{label:$L('Help'), value:"help", type:'affirmative'},
							{label:$L('Ok'), value:"ok", type:'dismissal'}
						]
					});
				}.bind(this)
			});
		}else{
			this.updateInfo("Already Exists: " + this.songfilename);
			//--> Do we set as a ringtone?
			if(action=="set"){
				this.ringtoneSet("/media/internal/" + FreeRingtones.Folder + "/" + this.fileName);
				//this.messageAlertSet("/media/internal/" + FreeRingtones.Folder + "/" + this.fileName);
			}else if(action=="email"){
				this.updateInfo("Sending email w/ attachment... [" + "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName + "]");
				palm.sendemailwithfile(this, "", this.contents, [{fullPath: "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName}]);
			}else if(action=="text"){
				this.updateInfo("Sending tex w/ attachment... [" + "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName + "]");
				palm.sendtextwithfile(this, this.contents, "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName);
			}else if(action=="sendto"){
				this.updateInfo("Sending To App... [" + "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName + "]");
				this.btnSendtoAppDo();
			}
		}
	}catch(e){
		this.commandMenuModel.items[1].label = "<span style='color:#FF0000; " + FreeRingtones.labelstyles + "'>" + $L("Download Failed") + "</span>";
		this.controller.modelChanged(this.commandMenuModel, this);
		
		Mojo.Controller.errorDialog($L("There was an error downloading the file.") + " " + e);
	}
}
SongsAssistant.prototype.ringtoneSet = function(path){
	try{
		this.commandMenuModel.items[2].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("Setting") + "</span>";
		this.controller.modelChanged(this.commandMenuModel, this);
		
		try{
			var request = new Mojo.Service.Request("palm://com.palm.systemservice", {
				method: "setPreferences",
				parameters: {
					"ringtone": {
						"fullPath": path,
						"name": this.songs.artistName + " - " + this.scrubRank(this.songs.trackName)
					}
				},
				onSuccess: function(e){
					//this.commandMenuModel.items[2].label = "<span style='color:#009933; " + FreeRingtones.labelstyles + "'>" + $L("Ringtone Set") + "</span>";
					//this.controller.modelChanged(this.commandMenuModel, this);

					//--> Update it as the currently set ringtone
					this.ringtoneCurrentPath = path;
					
					//--> Make sure it is set properly
					this.ringtoneCurrentlySet();
				}.bind(this),
				onFailure:function(e){
					this.commandMenuModel.items[2].label = "<span style='color:#FF0000; " + FreeRingtones.labelstyles + "'>" + $L("Ringtone Failed") + "</span>";
					this.controller.modelChanged(this.commandMenuModel, this);
					Mojo.Controller.errorDialog($L("There was an error setting the ringtone.") + " " + e);
				}.bind(this)			
			});
		}catch(e){
			this.updateInfo("Error setting ringtone: " + e);	
		}
	}catch(e){
		Mojo.Controller.errorDialog($L("There was an error setting the ringtone.") + " " + e);
	}
}
SongsAssistant.prototype.messageAlertSet = function(path){
	try{
		this.commandMenuModel.items[2].label = "<span style='" + FreeRingtones.labelstyles + "'>" + $L("Setting Alert") + "</span>";
		this.controller.modelChanged(this.commandMenuModel, this);
		
		var request = new Mojo.Service.Request("palm://com.palm.messaging", {
			method: "setNotificationPreferences",
			parameters: {
				"ringtonePath": path,
				"ringtoneName": this.songs.artistName + " - " + this.scrubRank(this.songs.trackName)
			},
			onSuccess: function(e){
				this.commandMenuModel.items[2].label = "<span style='color:#009933; " + FreeRingtones.labelstyles + "'>" + $L("Alert Set") + "</span>";
				this.controller.modelChanged(this.commandMenuModel, this);
			}.bind(this),
			onFailure:function(e){
				this.commandMenuModel.items[2].label = "<span style='color:#FF0000; " + FreeRingtones.labelstyles + "'>" + $L("Alert Failed") + "</span>";
				this.controller.modelChanged(this.commandMenuModel, this);
				Mojo.Controller.errorDialog($L("There was an error setting the alert tone.") + " " + Object.toJSON(e));
			}.bind(this)			
		});
	}catch(e){
		Mojo.Controller.errorDialog($L("There was an error setting the alert tone.") + " " + e);
	}
}
SongsAssistant.prototype.downloadAlbumArtwork = function(){
	if (this.songs.artworkUrl100 != "" && String(this.songs.artworkUrl100) != "undefined"){
		this.controller.showAlertDialog({
			onChoose: function(value){
				if (value=="yes"){
					this.downloadAlbumArtworkDo(0);
				}
			},
			preventCancel: false,
			title: $L("Download Album Cover?"),
			message: $L("Would you like to download the album cover artwork? Artwork is stored in the 'Album Cover Artwork' folder."),
			choices:[
				{label:$L('Yes'), value:"yes", type:'affirmative'},
				{label:$L('No'), value:"no", type:'negative'}
			]
		});
	}
}
SongsAssistant.prototype.downloadAlbumArtworkDo = function(i){
	this.fileName = this.scrubCharacters(Left(this.songs.artistName + " - " + this.songs.collectionName, 100)) + "." + fileCheck.ext(this.songs.previewUrl);
	
	//--> First Download
	this.controller.serviceRequest("palm://com.palm.downloadmanager/", {
		method:"download",
		parameters: {
			method: "allow1x",
			parameters: {value: true},
			target: this.songs.artworkUrl100,
			targetFilename: this.fileName,
			targetDir: "/media/internal/" + FreeRingtones.AlbumFolder + "/",
			keepFilenameOnRedirect: false,
			subscribe: false
		}
	});

	//--> Second Download
	this.controller.serviceRequest("palm://com.palm.downloadmanager/", {
		method:"download",
		parameters: {
			method: "allow1x",
			parameters: {value: true},
			target: this.songs.artworkUrl100,
			targetFilename: this.fileName,
			targetDir: "/media/internal/" + FreeRingtones.AlbumFolder + "/",
			keepFilenameOnRedirect: false,
			subscribe: true
		},
		onSuccess: function(e){
			if (e.completed){
				Mojo.Controller.getAppController().showBanner($L("Album Cover Downloaded."), {source: 'notification'});
			}else{
				//--> Still downloading
				//Mojo.Controller.getAppController().showBanner("Album Cover Download Failed. ", {source: 'notification'});
			}
		}.bind(this),
		onFailure:function(e){
			Mojo.Controller.getAppController().showBanner($L("Album Cover Download Failed.") + " " + e, {source: 'notification'});
		}.bind(this)
	});
}
SongsAssistant.prototype.ringtoneCurrent = function(){
	var request = new Mojo.Service.Request("palm://com.palm.systemservice", {
		method: "getPreferences",
		parameters: {"keys":["ringtone"]},
		subscribe:true,
		onSuccess: function(response){
			this.ringtoneCurrentPath = response.ringtone.fullPath;
			this.ringtoneCurrentName = response.ringtone.name;
			
			//--> Pull it every 300 seconds [5 minutes]
			this.ringtoneCurrent.bind(this).delay(300);
		}.bind(this),
		onFailure:function(e){
			this.updateInfo("Error getting keys: " + e)
		}.bind(this)			
	});
}
SongsAssistant.prototype.ringtoneCurrentlySet = function(){
	if (this.ringtoneCurrentPath == "/media/internal/" + FreeRingtones.Folder + "/" + this.fileName){
		this.commandMenuModel.items[2].label = "<span style='color:#009933; " + FreeRingtones.labelstyles + "'>" + $L("Ringtone Set") + "</span>";
		this.controller.modelChanged(this.commandMenuModel, this);
	}
}


SongsAssistant.prototype.scrubRank = function(){
	if (String(this.songs.rank) !="undefined" && this.songs.rank.length != 0 && this.songs.rank.length > 0 && this.songs.rank.length < 4){
		return Right(this.songs.trackName, (this.songs.trackName.length - (this.songs.rank.length + 2)))
	}else{
		return this.songs.trackName
	}
}
SongsAssistant.prototype.scrubCharacters = function(vName){
	this.vName = vName;
	this.vName = replaceAll(this.vName, "!", "");
	this.vName = replaceAll(this.vName, "**", "--");
	this.vName = replaceAll(this.vName, "*", "-");
	this.vName = replaceAll(this.vName, '"', '');
	this.vName = replaceAll(this.vName, "@", "");
	this.vName = replaceAll(this.vName, "#", "");
	this.vName = replaceAll(this.vName, "$", "");
	this.vName = replaceAll(this.vName, "%", "");
	this.vName = replaceAll(this.vName, ":", "");
	this.vName = replaceAll(this.vName, "&", "");
	this.vName = replaceAll(this.vName, "^", "");
	this.vName = replaceAll(this.vName, "~", "");
	this.vName = replaceAll(this.vName, "`", "");
	this.vName = replaceAll(this.vName, "/", "");
	this.vName = replaceAll(this.vName, "\\", "");
	this.vName = replaceAll(this.vName, "?", "");
	this.vName = replaceAll(this.vName, "¿", "");
	return this.vName;
}
SongsAssistant.prototype.scrubBadParts = function(data){
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


//========================================================
//--> BUTTONS/OPTIONS CONTROLS
//========================================================
SongsAssistant.prototype.btnLauncher = function(){
	var btnLauncherOptions = [
		//{command:"btnFavorite", label:"<img src='images/favorites-32x32.png' height='24px' style='margin-bottom:-4px;'>&nbsp;&nbsp;" + $L("Mark as Favorite")},
		//{command:"btnLyrics", label:"<img src='images/lyricwikia-32x32.png' height='24px' style='margin-bottom:-4px;'>&nbsp;&nbsp;Find Lyrics")},
		{command:"btnEmail", label:"<img src='images/email-32x32.png' height='24px' style='margin-bottom:-4px;'>&nbsp;&nbsp;" + $L("Email It")},
		{command:"btnText", label:"<img src='images/messaging-32x32.png' height='24px' style='margin-bottom:-4px;'>&nbsp;&nbsp;" + $L("Text It")},
		{command:"btnLyricsSearch", label:"<img src='images/browser-32x32.png' height='24px' style='margin-bottom:-4px;'>&nbsp;&nbsp;" + $L("Search for Lyrics")},
		{command:"btnFacebook", label:"<img src='images/facebook-32x32.png' height='24px' style='margin-bottom:-4px;'>&nbsp;&nbsp;" + $L("Facebook It")},
		{command:"btnTwitter", label:"<img src='images/twitter-32x32.png' height='24px' style='margin-bottom:-4px;'>&nbsp;&nbsp;" + $L("Tweet It")},
		//{command:"btnItunes", label:"<img src='images/itunes-32x32.png' height='24px' style='margin-bottom:-4px;'>&nbsp;&nbsp;" + $L("iTunes Link")},
		{command:"btnVolume", label:"<img src='images/soundsandringtones-32x32.png' height='24px' style='margin-bottom:-4px;'>&nbsp;&nbsp;" + $L("Volume & Ringtones")},
		{command:"btnSendToApp", label:"<img src='images/icon-sendto.png' height='24px' style='margin-bottom:-4px;'>&nbsp;&nbsp;" + $L("Send to App")},
		{command:"btnHelp", label:"<img src='images/help-32x32.png' height='24px' style='margin-bottom:-4px;'>&nbsp;&nbsp;" + $L("Help")}
	];
	this.controller.popupSubmenu({
		onChoose: this.btnLauncherHandler.bind(this), placeNear: this.controller.get("btnLauncher"), items: btnLauncherOptions
	});
}
SongsAssistant.prototype.btnEmail = function(){
	this.updateInfo("Launching Email Option");
	
	this.urlAmazon = "http://www.amazon.com/gp/redirect.html?ie=UTF8&location=http%3A%2F%2Fwww.amazon.com%2Fs%3Fie%3DUTF8%26x%3D0%26ref_%3Dnb%5Fsb%5Fnoss%26y%3D0%26field-keywords%3D" + Url.encode(this.songs.artistName) + "%2520-%2520" + this.scrubRank(this.songs.trackName) + "%26url%3Dsearch-alias%253Ddigital-music&tag=jeharrisonlin-20&linkCode=ur2&camp=1789&creative=390957";
	
	this.contents = "<b>" + $L("Song") + ":</b> " + this.scrubRank(this.songs.trackName) + "<br>"
	this.contents = this.contents + "<b>" + $L("Artist") + ":</b> " + this.songs.artistName + "<br>"
	this.contents = this.contents + "<b>" + $L("Album") + ":</b> " + this.songs.collectionName + "<br>"
	this.contents = this.contents + "<b>" + $L("Genre") + ":</b> " + this.songs.primaryGenreName + "<br><br>"
	this.contents = this.contents + $L("Purchase this Song") + ": <a href='" + this.urlAmazon + "'>Amazon</a> | <a href='" + this.songs.trackViewUrl + "'>iTunes</a><br><br>"
	this.contents = this.contents + $L("Sent from") + " <a href='http://developer.palm.com/appredirect/?packageid=" + Mojo.Controller.appInfo.id + "'>Free Music Ringtones for webOS</a>"

	this.controller.showAlertDialog({
		onChoose: function(value){
			if (value=="no"){
				palm.sendemail(this, "", this.contents);
			}else if (value=="cancel"){
				//--> Umm, do nothing...
			}else if (value=="yes"){
				this.updateInfo("Downloading and attaching..");
				if (this.songfilename == ""){
					Mojo.Controller.getAppController().showBanner($L("Email opens when download completes."), {source: 'notification'});
				}
				this.ringtoneDownload("email", 0);
			}
		},
		preventCancel: false,
		title: $L("Attach Ringtone to Email?"),
		message: $L("Would you like to download and attach the ringtone to the email?"),
		choices:[
			{label:$L('Yes'), value:"yes", type:'affirmative'},
			{label:$L('Cancel'), value:"cancel", type:'dismissal'},
			{label:$L('No'), value:"no", type:'negative'}
		]
	});
}
SongsAssistant.prototype.btnText = function(){
	this.contents = "" + this.scrubRank(this.songs.trackName) + " by " + this.songs.artistName + ": " + this.songs.previewUrl;
	
	//--> Just send the Song & Artist Name
	palm.sendtext(this, this.contents);
	
	/*
	//--> GAAA! Why can messaging not handle a 1meg file?!? THATS CRAZY TALK MAN!
	this.controller.showAlertDialog({
		onChoose: function(value){
			if (value=="no"){
				palm.sendtext(this, this.contents);
			}else if (value=="yes"){
				this.updateInfo("Downloading and attaching..");
				Mojo.Controller.getAppController().showBanner("Text opens when download completes.", {source: 'notification'});
				this.ringtoneDownload("text", 0);
			}
		},
		preventCancel: false,
		title: $L("Attach Ringtone to Text?"),
		message: $L("Would you like to download and attach the ringtone to the Text Message?"),
		choices:[
			{label:$L('Yes'), value:"yes", type:'affirmative'},
			{label:$L('No'), value:"no", type:'dismissal'}
		]
	});
	*/
}
SongsAssistant.prototype.btnFacebook = function(){
	var facebookText = "I'm listening to '" + this.scrubRank(this.songs.trackName) + "' by " + this.songs.artistName + " with Free Music Ringtones on my Palm " + Mojo.Environment.DeviceInfo.modelName + ": http://bit.ly/ciLLg0";
	
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
						this.btnLink("http://developer.palm.com/appredirect/?packageid=com.palm.app.facebook");
					}
				}.bind(this),
				preventCancel: false,
				title: $L("Facebook Not Installed"),
				message: $L("It looks like the Facebook app is not installed. You can download this app from the App Catalog (Free)."),
				choices:[
					{label:$L('No Thanks'), value:"ok", type:'dismissal'},
					{label:$L('Open in App Catalog'), value:"open", type:'affirmative'}
				]
			});
		}.bind(this)
	})
}
SongsAssistant.prototype.btnTwitter = function(){
	this.updateInfo("btnTwitter Called");
	//var url = "http://www.twitter.com/home?status=" + "Listening+to+'" + this.urlencode(this.scrubRank(this.songs.trackName)) + "'+by+" + this.urlencode(this.songs.artistName) + "+on+my+#Palm+" + Mojo.Environment.DeviceInfo.modelName + "+w/+Free+Music+Ringtones+http://bit.ly/ciLLg0";
	var url = "http://www.twitter.com/home?status=" + this.urlencode("Listening to '" + this.scrubRank(this.songs.trackName) + "' by " + this.songs.artistName + " w/ Free Music Ringtones http://bit.ly/ciLLg0");
	this.updateInfo(url);
	this.controller.serviceRequest('palm://com.palm.applicationManager', {
		method:'open',
		parameters:{
			target: url
		}
	});
}
SongsAssistant.prototype.btnAmazon = function(){
	//--> Older v: params: {artist: this.songs.artistName + ", " + this.scrubRank(this.songs.trackName)}
	this.controller.serviceRequest("palm://com.palm.applicationManager", {
		method: 'launch',
		parameters: {
			id: 'com.palm.app.amazonstore',
			params: {artist: this.scrubBadParts(this.songs.artistName) + ", " + this.scrubBadParts(this.scrubRank(this.songs.trackName))}
		},
		onSuccess:function(){
			this.audioStop();
			Mojo.Controller.getAppController().showBanner($L("Amazon results not guaranteed!"), {source: 'notification'});
		}.bind(this),
		onFailure:function(){
			this.controller.showAlertDialog({
				preventCancel: false,
				title: $L("Amazon App Not Installed"),
				message: $L("It looks like the Amazon app is not installed or there was an error launching it."),
				choices:[
					{label:$L('Close'), value:"ok", type:'dismissal'}
				]
			});
		}.bind(this)
	})
}
SongsAssistant.prototype.btnYouTube = function(){
	//--> Older v: params: {query: this.songs.artistName + ", " + this.scrubRank(this.songs.trackName)}
	this.controller.serviceRequest("palm://com.palm.applicationManager", {
		method: 'launch',
		parameters: {
			id: 'com.palm.app.youtube',
			params: {query: this.scrubBadParts(this.songs.artistName) + ", " + this.scrubBadParts(this.scrubRank(this.songs.trackName))}
		},
		onSuccess:function(){
			this.audioStop();
			Mojo.Controller.getAppController().showBanner($L("YouTube results not guaranteed!"), {source: 'notification'});
		}.bind(this),
		onFailure:function(){
			this.controller.showAlertDialog({
				preventCancel: false,
				title: $L("YouTube App Not Installed"),
				message: $L("It looks like the YouTub app is not installed or there was an error launching it."),
				choices:[
					{label:$L('Close'), value:"ok", type:'dismissal'}
				]
			});
		}.bind(this)
	})
}
SongsAssistant.prototype.btnLyricsSearch = function(){
	this.url = "http://www.google.com/search?q=Lyrics+" + encodeURIComponent(this.scrubBadParts(this.songs.artistName) + ", " + this.scrubBadParts(this.scrubRank(this.songs.trackName)));
	this.updateInfo("URL: " + this.url);
	
	this.controller.serviceRequest('palm://com.palm.applicationManager', {
		method:'open',
		parameters:{
			target: this.url
		}
	});
}
SongsAssistant.prototype.btnLyrics = function(){
	//--> Lyrics
	this.updateInfo("Doing Lyrics Stuff...");
	this.controller.showDialog({
		template: 'songs/lyrics-scene',
		assistant: new LyricsAssistant(this, this.btnLyricsCallback.bind(this), {artistName:this.songs.artistName, trackName:this.scrubRank(this.songs.trackName)})
	});
}
SongsAssistant.prototype.btnLyricsCallback = function(action){
	this.updateInfo("btnLyricsCallback Called...");
	if (action == "web"){
		this.btnLyricsSearch();
	}
}
SongsAssistant.prototype.btnFavorite = function(){
	if (this.favID == 0){
		this.dbStoreFavorite();
	}else{
		this.dbUnStoreFavorite();	
	}
}
SongsAssistant.prototype.btnLauncherHandler = function(a){
	//this.updateInfo("Selected: " + a);
	if (String(a)!="undefined" && a != ""){
		//--> Do our action
		if (a=="btnFacebook"){
			this.btnFacebook();
		}else if (a=="btnFavorite"){
			this.btnFavorite();
		}else if (a=="btnTwitter"){
			this.btnTwitter();
		}else if (a=="btnLyrics"){
			this.btnLyrics();
		}else if (a=="btnLyricsSearch"){
			this.btnLyricsSearch();
		}else if (a=="btnEmail"){
			this.btnEmail();
		}else if (a=="btnText"){
			this.btnText();
		}else if (a=="btnItunes"){
			this.btnItunes();
		}else if (a=="btnSendToApp"){
			this.btnSendtoApp();
		}else if (a=="btnVolume"){
			this.btnVolume();
		}else if (a=="btnHelp"){
			this.btnHelp();
		}else{
			this.updateInfo("No Action...");
		}
	}
}
SongsAssistant.prototype.btnVolume = function(){
	this.controller.serviceRequest('palm://com.palm.applicationManager', {
		method: 'launch',
		parameters: {id: "com.palm.app.soundsandalerts"},
		onFailure:function(){
			this.controller.showAlertDialog({
				onChoose: function(value){
					//--> Do nothing
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
SongsAssistant.prototype.btnItunesVisitWebsite = function(){
	this.updateInfo("btnItunesVisitWebsite URL: " + this.songs.trackViewUrl);
	this.controller.serviceRequest('palm://com.palm.applicationManager', {
		method:'open',
		parameters:{
			target: this.songs.trackViewUrl
		}
	});
}
SongsAssistant.prototype.btnItunes = function(){
	//--> Itunes
	this.controller.showDialog({
		template: 'songs/itunes-scene',
		assistant: new ItunesAssistant(this, this.btnItunesCallback.bind(this), this.songs)
	});
}
SongsAssistant.prototype.btnItunesCallback = function(action){
	this.updateInfo("btnItunesCallback called: " + action);
	if (action=="email"){
		this.btnEmail();
	}else if (action=="web"){
		this.btnItunesVisitWebsite();
	}
}
SongsAssistant.prototype.btnLink = function(url){
	this.controller.serviceRequest('palm://com.palm.applicationManager', {
		method:'open',
		parameters:{
			target: url
		}
	});
}
SongsAssistant.prototype.btnHelp = function(){
	this.controller.stageController.pushScene("help");
}
SongsAssistant.prototype.btnSendtoApp = function(){
	if (this.songfilename == ""){
		Mojo.Controller.getAppController().showBanner($L("Ringtone sends when download completes."), {source: 'notification'});
		this.ringtoneDownload("sendto", 0);
	}else{
		this.btnSendtoAppDo();
	}
}
SongsAssistant.prototype.btnSendtoAppDo = function(){
	this.controller.stageController.pushScene("sendtoapp", {alertFile: this.songfilename, alertName: this.songs.artistName + " - " + this.scrubRank(this.songs.trackName), artworkUrl100: this.songs.artworkUrl100});
}






//========================================================
//--> SEARCHING CONTROLS
//========================================================
SongsAssistant.prototype.searchArtist = function(){
	if (this.songs.artistName != "" && String(this.songs.artistName) != "undefined"){
		this.controller.showAlertDialog({
			onChoose: function(value){
				if (value=="yes"){
					FreeRingtones.SearchType = "artist";
					this.controller.stageController.popScenesTo("first");
					this.controller.stageController.pushScene("search", {srchTerms: this.songs.artistName, srchCountry:this.params.country, srchDo:true});
				}else if (value=="copy"){
					Mojo.Controller.stageController.setClipboard(this.songs.artistName);
					Mojo.Controller.getAppController().showBanner($L("Artist Name copied to clipboard."), {source: 'notification'});
				}
			},
			preventCancel: false,
			title: $L("Search for Artist?"),
			message: $L("Search for the artist") + " '" + this.songs.artistName + "'?",
			choices:[
				{label:$L('Yes'), value:"yes", type:'affirmative'},
				{label:$L('Copy to Clipboard'), value:"copy", type:'dismissal'},
				{label:$L('No'), value:"no", type:'negative'}
			]
		});
	}
}
SongsAssistant.prototype.searchTrack = function(){
	if (this.scrubRank(this.songs.trackName) != "" && String(this.scrubRank(this.songs.trackName)) != "undefined"){
		this.controller.showAlertDialog({
			onChoose: function(value){
				if (value=="yes"){
					FreeRingtones.SearchType = "song";
					this.controller.stageController.popScenesTo("first");
					this.controller.stageController.pushScene("search", {srchTerms: this.scrubRank(this.songs.trackName), srchCountry:this.params.country, srchDo:true});
				}else if (value=="copy"){
					Mojo.Controller.stageController.setClipboard(this.scrubRank(this.songs.trackName));
					Mojo.Controller.getAppController().showBanner($L("Song Name copied to clipboard."), {source: 'notification'});
				}
			},
			preventCancel: false,
			title: $L("Search for Song?"),
			message: $L("Search for the song") + " '" + this.scrubRank(this.songs.trackName) + "'?",
			choices:[
				{label:$L('Yes'), value:"yes", type:'affirmative'},
				{label:$L('Copy to Clipboard'), value:"copy", type:'dismissal'},
				{label:$L('No'), value:"no", type:'negative'}
			]
		});
	}
}
SongsAssistant.prototype.searchAlbum = function(){
	if (this.songs.collectionName != "" && String(this.songs.collectionName) != "undefined"){
		this.controller.showAlertDialog({
			onChoose: function(value){
				if (value=="yes"){
					FreeRingtones.SearchType = "album";
					this.controller.stageController.popScenesTo("first");
					this.controller.stageController.pushScene("search", {srchTerms: this.songs.collectionName, srchCountry:this.params.country, srchDo:true});
				}else if (value=="copy"){
					Mojo.Controller.stageController.setClipboard(this.songs.collectionName);
					Mojo.Controller.getAppController().showBanner($L("Album Name copied to clipboard."), {source: 'notification'});
				}
			},
			preventCancel: false,
			title: $L("Search for Album?"),
			message: $L("Search for the Album") + " '" + this.songs.collectionName + "'?",
			choices:[
				{label:$L('Yes'), value:"yes", type:'affirmative'},
				{label:$L('Copy to Clipboard'), value:"copy", type:'dismissal'},
				{label:$L('No'), value:"no", type:'negative'}
			]
		});
	}
}




//========================================================
//--> AUDIO CONTROLS
//========================================================
SongsAssistant.prototype.audioSetup = function(){
	try{
		// set the audio objects to the audio html tag ids
		this.audioEnded =  this.audioEndPlay.bind(this);
		this.audioErrored =  this.audioError.bind(this);
		
		this.audioListen.addEventListener('ended', this.audioEnded, false);

		try{
			this.audioListen.addEventListener('error', this.audioErrored, false);
			//this.audioListen.addEventListener('stalled', this.audioStalled, false);
		}catch(e){
			this.updateInfo("error listeners error: " + e + "(ironic eh?)")	;
		}
		
		//this.updateInfo("audioSetup Completed");
	}catch(e){
		this.updateInfo("audioSetup Error: " + e);
	}
}
SongsAssistant.prototype.audioPreload = function(src){
	try{
		if (src != "" && src != null){
			//this.updateInfo("Loading Audio Source: " + src);
			this.audioListen.src = src;
			this.audioListen.load();
			
			this.audioAddPlay();
		}else{
			//this.audioListen.src = null;
		}
	}catch(e){
		this.updateInfo("audioPreload Error: " + e);
	}
}
SongsAssistant.prototype.audioPlay = function(url){
	try{
		//--> Play It
		this.audioListen.play();
		
		//--> Swap to actual stop button
		this.audioAddStop();
		
		//this.updateInfo("** --> ** audioPlay called");
	}catch(e){
		this.updateInfo("audioPlay Error: " + e);
	}
}
SongsAssistant.prototype.audioStopAll = function(){
	try{
		this.audioListen.pause();
	}catch(e){}
}
SongsAssistant.prototype.audioStop = function(){
	//this.updateInfo("audioStop called");
	try{
		//--> Play It
		this.audioListen.pause();

		try{
			this.audioListen.currentTime=0.0;
		}catch(e){
			this.updateInfo("** --> ** audioResetQuestion Error: " + e);
		}

		//--> Swap to actual stop button
		this.audioAddPlay();
	}catch(e){
		this.updateInfo("** --> ** audioStop Error: " + e);
	}
}
SongsAssistant.prototype.audioClear = function(){
	//this.updateInfo("** --> ** audioClear called");
	try{
		if (!this.commandMenuModel.items[0].disabled){
			this.commandMenuModel.items[0].iconPath = null;
			this.commandMenuModel.items[0].command = null;
			this.commandMenuModel.items[0].disabled = null;
			this.controller.modelChanged(this.commandMenuModel, this);
			this.audioStopAll();
		}
	}catch(e){
		this.updateInfo("audioClear Error: " + e);
	}
}
SongsAssistant.prototype.audioAddPlay = function(){
	//this.updateInfo("** --> ** audioAddPlay called");
	try{
		this.commandMenuModel.items[0].iconPath = "images/icon-play.png";
		this.commandMenuModel.items[0].command = "play";
		this.commandMenuModel.items[0].disabled = false;
		this.controller.modelChanged(this.commandMenuModel, this);
	}catch(e){
		this.updateInfo("audioAddPlay Error: " + e);
	}
}
SongsAssistant.prototype.audioAddStop = function(){
	//this.updateInfo("** --> ** audioAddStop called");
	try{
		this.commandMenuModel.items[0].iconPath = "images/icon-pause.png";
		this.commandMenuModel.items[0].command = "pause";
		this.commandMenuModel.items[0].disabled = false;
		this.controller.modelChanged(this.commandMenuModel, this);
	}catch(e){
		this.updateInfo("audioAddStop Error: " + e);
	}
}
SongsAssistant.prototype.audioEndPlay = function(itm){
	//this.updateInfo("** --> ** audioEndPlay called [" + itm + "]");
	try{
		//--> Swap back to play button (if audio still enabled)
		if (this.commandMenuModel.items[0].disabled == false){
			this.audioAddPlay();
		}
	}catch(e){
		this.updateInfo("audioEndPlay Error: " + e);
	}
}
SongsAssistant.prototype.audioStalled = function(e){
	Mojo.Controller.errorDialog("The audio playback stalled. Please try again.");
}
SongsAssistant.prototype.audioError = function(e){
	try{
		this.updateInfo("** --> ** audioError called [" + e + "]");
		switch (e.target.error.code){
			case e.target.error.MEDIA_ERR_ABORTED:
				this.msg = "Audio Playback was aborted.";
				//break;
			case e.target.error.MEDIA_ERR_NETWORK:
				this.msg = "A network error caused the audio download to fail part-way.";
				//break;
			case e.target.error.MEDIA_ERR_DECODE:
				this.msg = "The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.";
				//break;
			case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
				this.msg = "The audio could not be loaded, either because the server or network failed or because the format is not supported.";
				//break;
			default:
				this.msg = "An unknown error occurred. Check your signal strength.";
				//break;
		}
		
		if (!this.connectionAvailable){
			this.msg = "There is no data connection at this time. This is required to listen and download ringtones.";
		}
		
		this.updateInfo("Audio Error: " + this.msg);
		Mojo.Controller.errorDialog("There was an error playing the audio. Details: " + this.msg);
	}catch(e){
		this.updateInfo("audioError Error: " + e);
	}
}



//========================================================
//--> DATA CONNECTION CONTROLS
//========================================================
SongsAssistant.prototype.checkConnection = function(){
	this.controller.serviceRequest('palm://com.palm.connectionmanager', {
		method: 'getstatus',
		parameters: {subscribe: true},
		onSuccess: function(e){
			this.updateInfo("---------------------")
			this.updateInfo("Connection: " + e.isInternetConnectionAvailable + ", WIFI: " + e.wifi.state + ", WAN: " + e.wan.state);
			try{
				if (!e.isInternetConnectionAvailable){
					this.connectionAvailable = false;
					this.checkConnectionAlert(false, false, "none", e);
				}else{
					this.connectionAvailable = true;
					if (e.wifi.state == "connected"){
						//nothing to do here.
						this.checkConnectionAlert(true, true, "wifi", e);
					}else{
						if (e.wan.state == "connected"){
							if (e.wan.network == "unknown" || e.wan.network == "unusable" || e.wan.network == "1x"){
								//might not be able to download	
								this.checkConnectionAlert(false, false, e.wan.network, e);
							}else{
								this.checkConnectionAlert(true, false, e.wan.network, e);
							}
						}else{
							//might not be able to download	
							this.checkConnectionAlert(false, false, e.wan.network, e);
						}
					}
				}
			}catch(e){
				this.updateInfo("checkConnection success error: " + e);
			}
		}.bind(this),
		onFailure: function(e){
			//--> ?? Dunno if connection is available or not...
			this.checkConnectionAlert(true, true, "", {});
			this.updateInfo("Connection FAILURE: " + e.errorText);
		}.bind(this)
	});
	
	//--> Ensure a check is done every 5 min
	this.checkConnection.bind(this).delay(300);
}
SongsAssistant.prototype.checkConnectionAlert = function(vAvailable, vWifi, vType, obj){
	this.updateInfo("checkConnectionAlert vAvailable: " + vAvailable + ", Wifi: " + vWifi);
	if (vAvailable){
		this.controller.get("connection").style.display = "none";
		this.controller.get("wifi").style.display = "none";
		
		if (!vWifi){
			this.controller.get("wifi").style.display = "";			//--> Display Wifi Suggestion
		}
	}else{
		this.updateInfo("checkConnectionAlert vType: " + vType);
		if (vType == "1x"){
			var msg = $L("You are currently on a 1x data connection. This is very slow, and downloads may not be possible.");
		}else{
			var msg = $L("There is currently no Internet connection. You may not be able to listen or download ringtones.");
		}
		this.controller.get("connection").style.display = "";
		this.controller.get("connection-msg").innerHTML = msg;	
	}

	//--> Ensure Sprint Pixi does not get this message. They have no Wifi!
	if (Mojo.Environment.DeviceInfo.carrierName == "Sprint" && Mojo.Environment.DeviceInfo.modelName == "Pixi"){
		this.controller.get("wifi").style.display = "none";
	}
}


SongsAssistant.prototype.urlencode = function(str){
    // URL-encodes string  
    // 
    // version: 1004.2314
    // discuss at: http://phpjs.org/functions/urlencode
    // +   original by: Philip Peterson
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: AJ
    // +   improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +      input by: travc
    // +      input by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Lars Fischer
    // +      input by: Ratheous
    // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
    // +   bugfixed by: Joris
    // +      reimplemented by: Brett Zamir (http://brett-zamir.me)
    // %          note 1: This reflects PHP 5.3/6.0+ behavior
    // %        note 2: Please be aware that this function expects to encode into UTF-8 encoded strings, as found on
    // %        note 2: pages served as UTF-8
    // *     example 1: urlencode('Kevin van Zonneveld!');
    // *     returns 1: 'Kevin+van+Zonneveld%21'
    // *     example 2: urlencode('http://kevin.vanzonneveld.net/');
    // *     returns 2: 'http%3A%2F%2Fkevin.vanzonneveld.net%2F'
    // *     example 3: urlencode('http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a');
    // *     returns 3: 'http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a'
    try{
		str = (str+'').toString();
		//str = escape(str);
		str = replaceAll(str, " ", "+");
		str = replaceAll(str, "%20", "+");
		str = replaceAll(str, "%3A", ":");
		str = replaceAll(str, "#", "%23");
		
		
		// Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
		// PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
		str.replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').
			replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+').replace(/ /g, '+').replace(/#/g, '%23');
		
		return str;
	}catch(e){
		this.updateInfo("Encoded Error: " + e);
	}
}







SongsAssistant.prototype.dbStoreDownload = function(){
	this.songsb = this.songs;
	this.songsb.trackName = this.scrubRank(this.songs.trackName);
	this.songsb.rank = 0;
	this.todaysDate = new Date();
	FreeRingtones.Database.transaction( 
		(function (transaction) {
			strSQL = "INSERT INTO tblDownloads (dlDate, dlSong, dlArtist, dlAlbum, dlGenre, dlImage, dlFilepath, dlJSON)"
			strSQL = strSQL + " VALUES "
			strSQL = strSQL + "('" + this.todaysDate + "','" + sql.fix(this.scrubRank(this.songs.trackName)) + "','" + sql.fix(this.songs.artistName) + "','" + sql.fix(this.songs.collectionName) + "','" + sql.fix(this.songs.primaryGenreName) + "','" + sql.fix(this.songs.artworkUrl100) + "','" + sql.fix(this.songfilename) + "','" + sql.fix(JSON.stringify(this.songsb)) + "')"
				 transaction.executeSql(strSQL, [], this.dbExecuteSuccess.bind(this), this.dbExecuteError.bind(this));
			
			this.updateInfo("dbStoreDownload Finished");
		}).bind(this) 
	);
}
SongsAssistant.prototype.dbStoreDownloadRemove = function(filePath){
	FreeRingtones.Database.transaction( 
		(function (transaction) {
			transaction.executeSql("DELETE FROM tblDownloads WHERE dlFilepath = '" + filePath + "'", []);
			this.updateInfo("dbStoreDownloadRemove Finished");
		}).bind(this) 
	);
}
SongsAssistant.prototype.dbStoreDownloadCheck = function(){
	FreeRingtones.Database.transaction( 
		(function(transaction) {
			 transaction.executeSql("SELECT dlID FROM tblDownloads WHERE dlFilepath = '" + sql.fix(this.songfilename) + "'", [], (function(transaction, results){
				if (results.rows.length == 0){
					this.dbStoreDownload();
				}
			 }).bind(this));
			this.updateInfo("dbStoreDownload Finished");
		}).bind(this) 
	);
}
SongsAssistant.prototype.dbStoreFavorite = function(){
	try {
		//--> Clear Rank
		this.songsb = this.songs;
		this.songsb.trackName = this.scrubRank(this.songs.trackName);
		this.songsb.rank = 0;
		this.todaysDate = new Date();
		FreeRingtones.Database.transaction( 
	        (function (transaction){
				strSQL = "INSERT INTO tblFavorites (favDate, favSong, favArtist, favAlbum, favGenre, favImage, favJSON)"
				strSQL = strSQL + " VALUES "
				strSQL = strSQL + "('" + this.todaysDate + "','" + sql.fix(this.scrubRank(this.songs.trackName)) + "','" + sql.fix(this.songs.artistName) + "','" + sql.fix(this.songs.collectionName) + "','" + sql.fix(this.songs.primaryGenreName) + "','" + sql.fix(this.songs.artworkUrl100) + "','" + sql.fix(JSON.stringify(this.songsb)) + "')"
		             transaction.executeSql(strSQL, [], this.dbExecuteSuccess.bind(this), this.dbExecuteError.bind(this));
				
				//--> Now turn ON the star
				this.controller.get("titleFavoriteImage").style.display = "";
				this.setFavorite();
				
				//--> Banner notification
				//Mojo.Controller.getAppController().showBanner($L("Marked as Favorite"), {source: 'notification'});
				this.controller.get("noticeFavorites").innerHTML = $L("Marked as Favorite");
				this.controller.get("noticeFavorites").className = "noticeFavoritesShow";
				this.dbHideFavorite.bind(this).delay(2.5);
			}).bind(this) 
	    );
	}catch(e){
		this.updateInfo("dbStoreFavorite Error: " + e);
	}
}
SongsAssistant.prototype.dbUnStoreFavorite = function(){
	try {
		FreeRingtones.Database.transaction( 
	        (function (transaction) {
				strSQL = "DELETE FROM tblFavorites WHERE favID = " + this.favID + "";
		             transaction.executeSql(strSQL, [], this.dbExecuteSuccess.bind(this), this.dbExecuteError.bind(this));
				
				//--> Now turn OFF the star
				this.controller.get("titleFavoriteImage").style.display = "none";
				this.favID = 0;
				
				//--> Banner notification
				//Mojo.Controller.getAppController().showBanner($L("Removed from Favorites"), {source: 'notification'});
				this.controller.get("noticeFavorites").innerHTML = $L("Removed from Favorites");
				this.controller.get("noticeFavorites").className = "noticeFavoritesShow";
				this.dbHideFavorite.bind(this).delay(2.5);
			}).bind(this) 
	    );
	}catch(e){
		this.updateInfo("dbUnStoreFavorite Error: " + e);
	}
}
SongsAssistant.prototype.dbHideFavorite = function(){
	this.controller.get("noticeFavorites").className = "noticeFavoritesHide";
}
SongsAssistant.prototype.dbExecuteError = function(transaction, error, strSQL){
	this.updateInfo("ERROR [" + strSQL + "]: " + error.message);
}
SongsAssistant.prototype.dbExecuteSuccess = function(transaction, results){
	this.updateInfo("Success");
}


SongsAssistant.prototype.purchaseNoticeShow = function(){
	this.controller.get("noticePurchase").className = "noticePurchaseShow";
	this.purchaseNoticeHide.bind(this).delay(10);
}
SongsAssistant.prototype.purchaseNoticeHide = function(){
	this.controller.get("noticePurchase").className = "noticePurchaseHide";
	this.purchaseNoticeShow.bind(this).delay(900);
}






//======================================================
//--> iTunes Option (but why?)
//======================================================
function ItunesAssistant(sceneAssistant,callbackFuncItunes,obj){
	this.callbackFuncItunes = callbackFuncItunes;
	this.sceneAssistant = sceneAssistant;
	this.controller = sceneAssistant.controller;
	this.song = obj;
}
ItunesAssistant.prototype.setup = function(widget){
	this.widget = widget;

	try{
		this.CancelIt = this.CancelClick.bind(this);
		this.btnItunesEmail = this.EmailIt.bind(this);
		this.btnItunesWeb = this.VisitIt.bind(this);
		
		//Set up our event listeners.  One for button presses and one for the textfield's propertyChange event.
		Mojo.Event.listen(this.controller.get('btncancel'),Mojo.Event.tap,this.CancelIt);
		Mojo.Event.listen(this.controller.get('btnItunesWeb'),Mojo.Event.tap,this.btnItunesWeb);
		Mojo.Event.listen(this.controller.get('btnItunesEmail'),Mojo.Event.tap,this.btnItunesEmail);
	}catch(e){
		this.updateInfo("Setup Error: " + e);
	}
}
ItunesAssistant.prototype.updateInfo = function(data){
	if (FreeRingtones.doInfo){
		$("info").innerHTML = $("info").innerHTML + data + "<br>";
	}
}
ItunesAssistant.prototype.CancelClick = function(event){
	this.updateInfo("Show Dialog cancel clicked....");
	this.widget.mojo.close();
}
ItunesAssistant.prototype.EmailIt = function(event){
	this.callbackFuncItunes("email");
	this.widget.mojo.close();
}
ItunesAssistant.prototype.VisitIt = function(event){
	this.callbackFuncItunes("web");
	this.widget.mojo.close();
}
ItunesAssistant.prototype.activate = function(event){
}
ItunesAssistant.prototype.deactivate = function(event){
}
ItunesAssistant.prototype.cleanup = function(event){
	Mojo.Event.stopListening(this.controller.get('btncancel'),Mojo.Event.tap,this.CancelIt);
	Mojo.Event.stopListening(this.controller.get('btnItunesWeb'),Mojo.Event.tap,this.btnItunesWeb);
	Mojo.Event.stopListening(this.controller.get('btnItunesEmail'),Mojo.Event.tap,this.btnItunesEmail);
}








//======================================================
//--> Get the Lyrics
//======================================================
function LyricsAssistant(sceneAssistant,callbackFunc,obj){
	this.callbackFunc = callbackFunc;
	this.sceneAssistant = sceneAssistant;
	this.controller = sceneAssistant.controller;
	this.song = obj;
}
LyricsAssistant.prototype.setup = function(widget){
	this.widget = widget;

	try{
		this.btnCancel = this.CancelClick.bind(this);
		this.btnWeb = this.VisitIt.bind(this);
		
		//Set up our event listeners.  One for button presses and one for the textfield's propertyChange event.
		Mojo.Event.listen(this.controller.get('btnCancel'), Mojo.Event.tap,this.btnCancel);
		Mojo.Event.listen(this.controller.get('btnWeb'), Mojo.Event.tap,this.btnWeb);
		
		//--> Now do the lyrics
		this.lyricsGet();
	}catch(e){
		this.updateInfo("Setup Error: " + e);
	}
}
LyricsAssistant.prototype.updateInfo = function(data){
	if (FreeRingtones.doInfo){
		$("info").innerHTML = $("info").innerHTML + data + "<br>";
	}
}
LyricsAssistant.prototype.lyricsGet = function(){
	this.songCapitalized = this.song.trackName.toUpperCase();
	this.artistCapitalized = this.song.artistName.toUpperCase();
	this.lyricsQuery = this.artistCapitalized + ":" + this.songCapitalized;
	
	this.url = "http://lyrics.wikia.com/lyrics/" + encodeURIComponent(this.lyricsQuery);
	this.updateInfo(this.url);
	
	new Ajax.Request(this.url, {
		method: 'get',
		evalJS: false,
		evalJSON: 'force',
		onSuccess: this.lyricsProcess.bind(this),
		onFailure: this.lyricsFailure.bind(this),
		on404: this.lyricsFailure.bind(this),
		on500: this.lyricsFailure.bind(this)
	});
}
LyricsAssistant.prototype.CancelClick = function(event){
	this.updateInfo("Show Dialog cancel clicked....");
	this.widget.mojo.close();
}
LyricsAssistant.prototype.VisitIt = function(event){
	this.callbackFunc("web");
	this.widget.mojo.close();
}
LyricsAssistant.prototype.activate = function(event){
}
LyricsAssistant.prototype.deactivate = function(event){
}
LyricsAssistant.prototype.cleanup = function(event){
	Mojo.Event.stopListening(this.controller.get('btnCancel'), Mojo.Event.tap,this.btnCancel);
	Mojo.Event.stopListening(this.controller.get('btnWeb'), Mojo.Event.tap,this.btnWeb);
}

LyricsAssistant.prototype.lyricsFailure = function(request){
	this.controller.get("theLyrics").height = "75px";
	this.updateInfo("FAILED to Get Lyrics: " + request.message);
}
LyricsAssistant.prototype.lyricsProcess = function(request){
	this.updateInfo("GOT THE LYRICS!!");
	var url;
	var newSong;
	var remixInfoPos;
	
	//DEBUG Mojo.Log.info('Lyrics Request Success, lyrics_assistant.request.readyState = ' + lyrics_assistant.request.readyState);

	if (lyrics_assistant.request.readyState == 4) {
		
		//DEBUG Mojo.Log.info('Lyrics Request lyrics_assistant.request.status = ' + lyrics_assistant.request.status);
		
		if (lyrics_assistant.request.status == 200) {
		
			var success = false;
			
			var responseText = lyrics_assistant.request.responseText;
			
			var lyricsPrestartPos = -1;
			var lyricsStartPos = -1;
			var lyricsEndPos = -1;
			
			var alternateLyricFormat = false;
			var startPrefixStr = '';
			
			startPrefixStr = '\'LYRICBOX\'';
			lyricsPrestartPos = responseText.toUpperCase().indexOf(startPrefixStr);
			
			//DEBUG Mojo.Log.info('lyricsPrestartPos = ' + lyricsPrestartPos);
			
			if (lyricsPrestartPos < 0) {
				//DEBUG Mojo.Log.info('ALTERNATE');
				startPrefixStr = '&LT;LYRICS&GT;';
				lyricsPrestartPos = responseText.toUpperCase().indexOf('&LT;LYRICS&GT;');
				alternateLyricFormat = true;
			}
			else {
				//DEBUG Mojo.Log.info('NORMAL');
			}
			
			if (lyricsPrestartPos >= 0) {
			
				var lyricStrToEndOfDoc = '';
				
				lyricStrToEndOfDoc = Util.trim(Util.Mid(responseText, lyricsPrestartPos + 1, responseText.length - lyricsPrestartPos));
				
				if (lyricStrToEndOfDoc !== '') {
					
					var strBeforeLyrics;
					
					if (!alternateLyricFormat) {
						strBeforeLyrics = '>';
						lyricsStartPos = lyricStrToEndOfDoc.indexOf(strBeforeLyrics);
					}
					else {
						strBeforeLyrics = '';
						lyricsStartPos = startPrefixStr.length;
					}
					
					//DEBUG Mojo.Log.info('lyricsStartPos = ' + lyricsStartPos);
					
					if (lyricsStartPos >= 0) {
						
						var sDivText = "<DIV";
						var sPossibleDiv = Util.Mid(lyricStrToEndOfDoc, lyricsStartPos + 1, sDivText.length);
						sPossibleDiv = sPossibleDiv.toUpperCase();
					
						//DEBUG Mojo.Log.info('sPossibleDiv = ' + sPossibleDiv);
						
						if (!alternateLyricFormat) {
							
							if (sPossibleDiv == sDivText) {
								strBeforeLyrics = 'DIV>';
								lyricsStartPos = lyricStrToEndOfDoc.toUpperCase().indexOf(strBeforeLyrics);
								//DEBUG Mojo.Log.info('lyricsStartPos 2= ' + lyricsStartPos);
							}
							
							if (lyricsStartPos >= 0) {
								//var lyricsStrEndPosText = Util.Mid(lyricStrToEndOfDoc, lyricsStartPos, lyricStrToEndOfDoc.length - (lyricsStartPos + strBeforeLyrics.length));
								lyricsEndPos = lyricStrToEndOfDoc.toUpperCase().indexOf('NEWPP');
							}
						}
						else {
							lyricsEndPos = lyricStrToEndOfDoc.toUpperCase().indexOf('&LT;/LYRICS&GT;');
						}
						
						if (lyricsStartPos >= 0) {
							//DEBUG Mojo.Log.info('lyricsStartPos = ' + lyricsStartPos + ', lyricsEndPos = ' + lyricsEndPos);
							
							if (lyricsEndPos >= lyricsStartPos) {
								lyrics = Util.Mid(lyricStrToEndOfDoc, lyricsStartPos + strBeforeLyrics.length, lyricsEndPos - (lyricsStartPos + strBeforeLyrics.length));
								
								if (lyrics !== '') {
									lyrics_assistant.controller.get('lyrics').innerHTML = lyrics  + '<p>&nbsp;</p>';
									lyrics_assistant.callingScene.saveLyrics(lyrics);
									success = true;
								}
								else {
									lyrics_assistant.controller.get('lyrics').innerHTML = 'Unable to parse lyrics - code 106';
								}
							}
							else {
								lyrics_assistant.controller.get('lyrics').innerHTML = 'Unable to parse lyrics - code 105';
							}
						}
						else {
							lyrics_assistant.controller.get('lyrics').innerHTML = 'Unable to parse lyrics - code 104';
						}
					}
					else {
						lyrics_assistant.controller.get('lyrics').innerHTML = 'Unable to parse lyrics - code 103';
					}
				}
				else {
					lyrics_assistant.controller.get('lyrics').innerHTML = 'Unable to parse lyrics - code 102';
				}
			}
			else {
				// Sometimes pages don't load right the first time.  Retry it one time.
				if (lyrics_assistant.firstAttempt) {
				
					lyrics_assistant.firstAttempt = false;
					
					url = 'http://lyrics.wikia.com/lyrics/' + encodeURIComponent(lyrics_assistant.lyricsQuery);
					//DEBUG Mojo.Log.info('Lyrics setup, url = ' + url);
					
					lyrics_assistant.request.open('GET', url, true);
					lyrics_assistant.request.send(null);
					
				}
				else {
					if (!lyrics_assistant.remixAttempt) {
					
						lyrics_assistant.remixAttempt = true;
						
						newSong = '';
						remixInfoPos = lyrics_assistant.songCapitalized.lastIndexOf('(');
						
						// The song may have remix/mix info, so let's strip it away and
						// re-search the lyrics service without it.
						if (remixInfoPos > 0) {
						
							newSong = Util.trim(Util.Mid(lyrics_assistant.songCapitalized, 0, remixInfoPos));
							lyrics_assistant.songCapitalized = newSong;
							
							lyrics_assistant.lyricsQuery = lyrics_assistant.artistCapitalized + ':' + lyrics_assistant.songCapitalized;
							url = 'http://lyrics.wikia.com/lyrics/' + encodeURIComponent(lyrics_assistant.lyricsQuery);
							//DEBUG Mojo.Log.info('Lyrics requestFailure second try, url = ' + url);
							
							lyrics_assistant.request.open('GET', url, true);
							lyrics_assistant.request.send(null);
							
						}
						else {
							lyrics_assistant.controller.get('lyrics').innerHTML = 'Unable to parse lyrics - code 101';
							
							lyrics_assistant.spinnerModel.spinning = false;
							lyrics_assistant.controller.modelChanged(lyrics_assistant.spinnerModel);
						}
					}
					else {
						//DEBUG Mojo.Log.info('Lyrics Request Failure 2');
						lyrics_assistant.controller.get('lyrics').innerHTML = 'Unable to parse lyrics - code 100';
			
						lyrics_assistant.spinnerModel.spinning = false;
						lyrics_assistant.controller.modelChanged(lyrics_assistant.spinnerModel);
					}
				}
			}
			
			lyrics_assistant.spinnerModel.spinning = false;
			lyrics_assistant.controller.modelChanged(lyrics_assistant.spinnerModel);
		}
		else {
			
			if (!lyrics_assistant.remixAttempt) {
			
				lyrics_assistant.remixAttempt = true;
				
				newSong = '';
				remixInfoPos = lyrics_assistant.songCapitalized.lastIndexOf('(');
				
				// The song may have remix/mix info, so let's strip it away and
				// re-search the lyrics service without it.
				if (remixInfoPos > 0) {
				
					newSong = Util.trim(Util.Mid(lyrics_assistant.songCapitalized, 0, remixInfoPos));
					lyrics_assistant.songCapitalized = newSong;
					
					lyrics_assistant.lyricsQuery = lyrics_assistant.artistCapitalized + ':' + lyrics_assistant.songCapitalized;
					url = 'http://lyrics.wikia.com/lyrics/' + encodeURIComponent(lyrics_assistant.lyricsQuery);
					//DEBUG Mojo.Log.info('Lyrics requestFailure second try, url = ' + url);
					
					lyrics_assistant.request.open('GET', url, true);
					lyrics_assistant.request.send(null);
					
				}
				else {
					lyrics_assistant.controller.get('lyrics').innerHTML = 'Unable to find lyrics for this song';
					
					lyrics_assistant.spinnerModel.spinning = false;
					lyrics_assistant.controller.modelChanged(lyrics_assistant.spinnerModel);
				}
			}
			else {
				//DEBUG Mojo.Log.info('Lyrics Request Failure 2');
				lyrics_assistant.controller.get('lyrics').innerHTML = 'Unable to find lyrics for this song';
	
				lyrics_assistant.spinnerModel.spinning = false;
				lyrics_assistant.controller.modelChanged(lyrics_assistant.spinnerModel);
			}
		}
	}
}