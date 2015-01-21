jb_component('dataTest',{
	params: {
		calculate: {},
		expectedResult: { type: "boolean", dynamic: true, jstype: 'boolean' }
	},
	impl: function(context,calculate,expectedResult) {
		if (!calculate || !calculate.promise)	// sync
			return expectedResult(jb_ctx(context,{ data: calculate }));
		else 
			return $.when(calculate).then(function(_calculate) {
				return expectedResult(jb_ctx(context,{ data: _calculate }));
			});
	}
});


