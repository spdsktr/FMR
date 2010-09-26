var preferences = {
	save: function(obj, ckHolder){
		obj.put({
			ckTopCountyCode: ckHolder.ckTopCountyCode,
			ckTopCountyName: ckHolder.ckTopCountyName,
			ckTopCountyItunes: ckHolder.ckTopCountyItunes,
			ckTopCountyGenre: ckHolder.ckTopCountyGenre,
			ckLocaleLanguage: ckHolder.ckLocaleLanguage,
			ckLocaleCountry: ckHolder.ckLocaleCountry,
			ckSearchCountry: ckHolder.ckSearchCountry,
			ckPrefRandUpdateBackgroundEnable: ckHolder.ckPrefRandUpdateBackgroundEnable,
			ckPrefRandUpdateInterval: ckHolder.ckPrefRandUpdateInterval,
			ckPrefRandUpdateLast: ckHolder.ckPrefRandUpdateLast,
			ckHelpFAQs: ckHolder.ckHelpFAQs,
			ckMiscA: ckHolder.ckMiscA,
			ckMiscB: ckHolder.ckMiscB,
			ckMiscC: ckHolder.ckMiscC,
			ckMiscD: ckHolder.ckMiscD
		});
	},

	dodefault: function(obj){
		try{
			obj.put({
				ckTopCountyCode: "us",
				ckTopCountyName: "USA",
				ckTopCountyItunes: "143441",
				ckTopCountyGenre: "0",
				ckLocaleLanguage: "",
				ckLocaleCountry: "",
				ckSearchCountry: "us",
				ckPrefRandUpdateBackgroundEnable: false,
				ckPrefRandUpdateInterval: "00:00:00",
				ckPrefRandUpdateLast: "Never",
				ckHelpFAQs: false,
				ckMiscA: "",
				ckMiscB: "",
				ckMiscC: "",
				ckMiscD: ""
			});
		}catch(e){}
	}
}