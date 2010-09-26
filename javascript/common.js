var bg = {
	assignCovers: function(that, obj){
		try{
			//--> Get our iTunesCode
			if (obj.length > 0){
				var randomnumber = Math.floor(Math.random()*obj.length)
				that.controller.get("imgAlbumImage2").src = obj[randomnumber].artworkUrl100;
			}
			if (obj.length > 1){
				var randomnumber = Math.floor(Math.random()*obj.length)
				that.controller.get("imgAlbumImage3").src = obj[randomnumber].artworkUrl100;
			}
			if (obj.length > 2){
				var randomnumber = Math.floor(Math.random()*obj.length)
				that.controller.get("imgAlbumImage1").src = obj[randomnumber].artworkUrl100;
			}
		}catch(e){
			//that.updateInfo("assignCovers error: " + e);
		}
	}
}

var fileCheck = {
	ext: function(url){
		return Right(url, 3);
	},

	isValid: function(url){
		if (LCase(Right(url,3))=="mp3" || LCase(Right(url,3))=="m4a" || LCase(Right(url,3))=="wav"){
			return true;
		}else{
			return false;
		}
	},

	scrubInvalids: function(obj){
		Mojo.Log.info("====================================");
		Mojo.Log.info("Originally there were " + obj.results.length + " Records");
		for (var i = 0; i < obj.results.length; i++){
			Mojo.Log.info("Record # " + i + ": " + this.ext(obj.results[i].previewUrl) + " = " + this.isValid(obj.results[i].previewUrl));
			if (!this.isValid(obj.results[i].previewUrl)){
				Mojo.Log.info("Deleted! [strongbad style]");
				obj.results.splice(i, 1);
				i--;
			}
		}
		obj.resultCount = obj.results.length;
		return obj;
	}
}



var sql = {
	fix: function(data){
		if (data!=null){
			data = data.split("'").join("''");
		}
		return data;
	},
	
	dbConnection: function(){
		try{
			if (FreeRingtones.Database==null){
				FreeRingtones.Database = openDatabase("ext:FreeMusicRingtones", "1.0", "Free Music Ringontes DATABASE",500000);
				if (!FreeRingtones.Database){
					Mojo.Log.info("Failed to open the database on the disk. This is probably because the there is not enough space left on the disk.");
				}else{
					Mojo.Log.info("DB Successfully Opened");
				}
			}
		}catch(e){}	
	},
	
	//--> Removes duplicate records from the 'downloads' table. Only needed for older versions or in case something goes completes WANKO
	removeDups: function(){
		try{
			FreeRingtones.Database.transaction(
				(function(readTransaction){
					try {
						readTransaction.executeSql("SELECT dlID, dlFilepath FROM tblDownloads ORDER BY dlFilepath ASC;", [],
							function(transaction, results){
								
								//--> Temp variables
								var tempRecords = [];
								var tempExists = false;
								
								//--> Loop through all records, and determine if dups exist
								if (results.rows.length > 0){
									for (var i = 0; i < results.rows.length; i++){
										//--> Default exists = false
										tempExists = false;
										
										//--> Check existing records to see if already exists
										for (var p = 0; p < tempRecords.length; p++){
											if (tempRecords[p].file == results.rows.item(i)["dlFilepath"]){
												tempExists = true;
											}
										}
										
										//--> If it already exists, then we need to delete it. Else, add to temp list
										if (tempExists){
											transaction.executeSql("DELETE FROM tblDownloads WHERE dlID = " + results.rows.item(i)["dlID"] + "", []);
										}else{
											tempRecords.push({file: results.rows.item(i)["dlFilepath"]});
										}
									}
								}
								
								//--> Clear out our temp storage variables
								tempRecords = null;
								tempExists = null;
							}.bind(this), 
							function(transaction){
								Mojo.Log.info("**--> DUP Check: Error in SQL");
							}.bind(this)
						);
					}catch(e){}
				}).bind(this)
			);
		}catch(e){}
	}
}

var palm = {
	sendemail : function (that, subject, message) {
		that.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'open',
			parameters: {
				id: 'com.palm.app.email',
				params: {
					summary: subject,
					text: message
				}				
			}
		});
	},
	
	sendemailspecific : function (that, recipients, subject, message) {
		that.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'open',
			parameters: {
				id: 'com.palm.app.email',
				params: {
					recipients: recipients,
					summary: subject,
					text: message
				}				
			}
		});
	},

	sendemailwithfile: function (that, subject, message, files) {
		that.controller.serviceRequest('palm://com.palm.applicationManager', {
			method: 'open',
			parameters: {
				id: 'com.palm.app.email',
				params: {
					summary: subject,
					text: message,
					attachments: files
				}				
			}
		});
	},

	sendtext : function (that, message) {
		that.controller.serviceRequest('palm://com.palm.applicationManager',{
			method: 'open',
			parameters: {
				id: 'com.palm.app.messaging',
				params: {
					messageText: message
					}
				}
		});
	},

	sendtextwithfile : function (that, message, file) {
		that.controller.serviceRequest('palm://com.palm.applicationManager',{
			method: 'open',
			parameters: {
				id: 'com.palm.app.messaging',
				params: {
					messageText: message,
					attachment: file
					}
				}
		});
	},

	openurl: function(that, url) {
		that.controller.serviceRequest('palm://com.palm.applicationManager', {
			method:'open',
			parameters:{
				target: url
			}
		});
	},
	
	callNumber: function(that, number) {
		that.controller.serviceRequest('palm://com.palm.applicationManager', {
			method:'open',
			parameters:{
				target: "tel://" + number
			}
		});
	}

}

var Url = {
	// public method for url encoding
	encode : function (string) {
		if (string==null){
			return "";
		}else{
			return escape(this._utf8_encode(string));
		}
	},
 
	// public method for url decoding
	decode : function (string) {
		if (string==null){
			return "";
		}else{
			return this._utf8_decode(unescape(string));
		}
	},
 
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		//string = string.replace(/\r\n/g,"\n");
		var utftext = "";
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	},
 
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
 
		while ( i < utftext.length ) {
 			c = utftext.charCodeAt(i);
 			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
 		}
 		return string;
	}
}
/* Courtesy of: http://mattsnider.com/javascript/type-detection/ */
function isBoolean(o) {return 'boolean' === typeof o;}
function isNumber(o) {return "number" == typeof o && isFinite(o);}
function isArray(o) {return isObject(o) && o.constructor == Array;}
function isAlien(o) {return isObject(o) && ! isFunction(o.constructor);}
function isDate(o) {return isObject(o) && o.getMonth;}
function isDomElement(o) {return o && ("undefined" !== typeof o.childNodes || o.nodeType);}
function isEvent(o){return o && "undefined" != typeof Event && o.eventPhase;}
function isNull(o) {return null === o;}
function isFunction(o) {return 'function' == typeof o;}
function isObject(o) {return (o && "object" == typeof o) || isFunction(o);}
function isSet(o) {return ((o || false === o || 0 === o) && ! isNull(o) && '' !== o && ! isUndefined(o));}
function isString(o) {return 'string' == typeof o;}									
function isUndefined(o) {return 'undefined' == typeof o;}
function isEmpty(o){
    var i, v;  
    if (isObject(o)) {  
        for (i in o) {  
            v = o[i];  
            if (! isUndefined(v) && ! isFunction(v)) {  
                return false;  
            }  
        }  
    }  
    return true;  
}  

function replaceAll(text, strA, strB){
	text = "" + text;
	while (text.indexOf(strA) != -1){
		text = text.replace(strA,strB);
	}
	return text;
}
function Left(str, n){
	if (n <= 0)
	    return "";
	else if (n > String(str).length)
	    return str;
	else
	    return String(str).substring(0,n);
}
function Right(str, n){
    if (n <= 0)
       return "";
    else if (n > String(str).length)
       return str;
    else {
       var iLen = String(str).length;
       return String(str).substring(iLen, iLen - n);
    }
}
function IsNumeric(sText){
	var ValidChars = "0123456789.";
	var IsNumber=true;
	var Char;
	for (i = 0; i < sText.length && IsNumber == true; i++){ 
		Char = sText.charAt(i); 
		if (ValidChars.indexOf(Char) == -1){
			IsNumber = false;
		}
	}
	return IsNumber;
}
function FormatCurrency(strValue){
	strValue = strValue.toString().replace(/\$|\,/g,'');
	dblValue = parseFloat(strValue);

	blnSign = (dblValue == (dblValue = Math.abs(dblValue)));
	dblValue = Math.floor(dblValue*100+0.50000000001);
	intCents = dblValue%100;
	strCents = intCents.toString();
	dblValue = Math.floor(dblValue/100).toString();
	if(intCents<10)

		strCents = "0" + strCents;
	for (var i = 0; i < Math.floor((dblValue.length-(1+i))/3); i++)
		dblValue = dblValue.substring(0,dblValue.length-(4*i+3))+','+
		dblValue.substring(dblValue.length-(4*i+3));
	return (((blnSign)?'':'-') + '$' + dblValue + '.' + strCents);
}
function FormatNumber(num,decimalNum,bolLeadingZero,bolParens,bolCommas){
	if (isNaN(parseInt(num))) return "NaN";
	var tmpNum = num;
	var iSign = num < 0 ? -1 : 1;		// Get sign of number
	// Adjust number so only the specified number of numbers after
	// the decimal point are shown.
	tmpNum *= Math.pow(10,decimalNum);
	tmpNum = Math.round(Math.abs(tmpNum))
	tmpNum /= Math.pow(10,decimalNum);
	tmpNum *= iSign;					// Readjust for sign
	// Create a string object to do our formatting on
	var tmpNumStr = new String(tmpNum);
	// See if we need to strip out the leading zero or not.
	if (!bolLeadingZero && num < 1 && num > -1 && num != 0)
		if (num > 0)
			tmpNumStr = tmpNumStr.substring(1,tmpNumStr.length);
		else
			tmpNumStr = "-" + tmpNumStr.substring(2,tmpNumStr.length);
	// See if we need to put in the commas
	if (bolCommas && (num >= 1000 || num <= -1000)) {
		var iStart = tmpNumStr.indexOf(".");
		if (iStart < 0)
			iStart = tmpNumStr.length;
		iStart -= 3;
		while (iStart >= 1) {
			tmpNumStr = tmpNumStr.substring(0,iStart) + "," + tmpNumStr.substring(iStart,tmpNumStr.length)
			iStart -= 3;
		}		
	}
	// See if we need to use parenthesis
	if (bolParens && num < 0)
		tmpNumStr = "(" + tmpNumStr.substring(1,tmpNumStr.length) + ")";
	return tmpNumStr;		// Return our formatted string!
}
function Trim(stringToTrim) {
	return stringToTrim.replace(/^\s+|\s+$/g,"");
}
function LTrim(stringToTrim) {
	return stringToTrim.replace(/^\s+/,"");
}
function RTrim(stringToTrim) {
	return stringToTrim.replace(/\s+$/,"");
}
function UCase(string) {
	return string.toUpperCase();
}
function LCase(string) {
	return string.toLowerCase();
}