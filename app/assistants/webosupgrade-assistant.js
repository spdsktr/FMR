function WebosupgradeAssistant(params){
}
WebosupgradeAssistant.prototype.setup = function(){


	//--> Our search button
	this.searchButtonAttributes = {
		//type: Mojo.Widget.activityButton
	};
	this.searchButtonModel = {
		buttonLabel: "Launch 'Updates' App",
		buttonClass: 'primary',
		disabled: false
	};

	this.controller.setupWidget('updateButton', this.searchButtonAttributes, this.searchButtonModel);
	Mojo.Event.listen(this.controller.get('updateButton'), Mojo.Event.tap, this.launchUpdateApp.bindAsEventListener(this));
}
WebosupgradeAssistant.prototype.activate = function(event){
}
WebosupgradeAssistant.prototype.deactivate = function(event){
}
WebosupgradeAssistant.prototype.cleanup = function(event){
}
WebosupgradeAssistant.prototype.handleCommand = function(event){
}
WebosupgradeAssistant.prototype.updateInfo=function(data){
	Mojo.Log.info("*** --> " + data);
	if (FreeRingtones.doInfo){
		this.controller.get("info").innerHTML = this.controller.get("info").innerHTML + data + "<br>";
	}
}
WebosupgradeAssistant.prototype.launchUpdateApp = function(){
	this.controller.serviceRequest('palm://com.palm.applicationManager', {
		method: 'launch',
		parameters: {id: "com.palm.app.updates"},
		onFailure:function(){
			this.controller.showAlertDialog({
				onChoose: function(value){
					//--> DO nothing
				},
				preventCancel: false,
				title: $L("Error"),
				message: $L("There was an error opening the Update's application."),
				choices:[
					{label:$L('Ok'), value:"ok", type:'dismissal'}
				]
			});
		}.bind(this)
	});
}
