jb_type('control',{description: "can be rendered to create a HTML control"});
jb_type('data',{description: "The most basic type of jbart. returns a data (usually without side effects)"});
jb_type('aggregator');
jb_type('boolean',{description: "Returns true/false"});
jb_type('action',{description: "Does some action"});
jb_type('dataResource');
jb_type('httpFeature');

jb_component('pipeline',{
	type: "data",
	params: {
		items: { type: "data[]", ignore: true }
	},
	impl: function(context,items) {
		var data = jb_toarray(context.data);
		var curr = (data.length) ? jb_toarray(context.data) : [null];
		jb_map(context.profile.items, function(profile,index) {
			if (profile.$filter)
				curr = jb_run(jb_ctx(context,	{ data: curr, profile: {$: 'passesFilter', filter: profile.$filter } }));
			else if (jb_profileType(profile) == 'aggregator')
				curr = jb_toarray( jb_run(jb_ctx(context,	{ data: curr, profile: profile })));
			else 
				curr = jb_map(curr,function(item) {
					return jb_run(jb_ctx(context,{data: item, profile: profile}));
				});
		});
		return curr;
  }
});

jb_component('list',{
	type: "data",
	params: {
		items: { type: "data[]", jstype: 'array' }
	},
	impl: function(context,items) {
		return items;
	}
});

jb_component('data.if',{
	type: "data",
	params: {
		condition: { type: "boolean", jstype: 'boolean' },
		"then": { dynamic: true },
		"else": { dynamic: true }		
	},
	impl: function(context,condition,thenArg,elseArg) {
		return condition ? thenArg() : elseArg();
	}
});

jb_component('jsonPath',{
	type: "data",
	params: {
		parent: { defaultValue: '{{.}}', jstype: 'object' },
		path: { jstype: 'string' }
	},
	impl: function(context,parent,path) {
		return parent && jb_run(jb_ctx(context,{ data: parent, profile: '{{' + path + '}}' }));
	}
});

jb_component('objectProperties',{
	type: "data",
	params: {
		object: { defaultValue: '{{.}}', jstype: 'object' }
	},
	impl: function(context,object) {
		return object && jb_evalExpressionPart('*',jb_ctx(context,{data:object}));
	}
});

jb_component('propertyName',{
	type: "data",
	impl: function(context) {
		return context.data && context.data.$jb_property;
	}
});

jb_component('writeValue',{
	type: 'action',
	params: {
		to: { jstype: 'object' },
		value: {}
	},
	impl: function(context,to,value) {
		jb_writeValue(to,value);
	}
});

jb_component('addCssClass',{
	type: 'action',
	params: {
		cssClass: { jstype: 'string' }
	},
	impl: function(context,cssClass) {
		if (context.vars.$control && context.vars.$control.$el) 
			context.vars.$control.$el.addClass(cssClass);
	}
});

jb_component('setText',{
	type: 'action',
	params: {
		text: { jstype: 'string' },
		controlID: { jstype: 'string' }
	},
	impl: function(context,text,controlID) {
		var elem = jb_findControlElement(context.vars.$control.el,controlID);
		if (!elem) return;
		var input = $(elem).findIncludeSelf('input,textarea')[0];
		if (input) {
			$(input).val(text);
			input.jbUpdated && input.jbUpdated();
		}
	}
});

jb_component('urlParam',{
	type: 'data',
	params: {
		param: { jstype: 'string' }
	},
	impl: function(context,param) {
		return jb_urlParam(param);
	}
});

jb_component('urlHashParam',{
	type: 'data',
	params: {
		param: { jstype: 'string' }
	},
	impl: function(context,param) {
		if (!jbart.classes.urlHashParam) {
			jbart.classes.urlHashParam = function(param) { this.param = this.$jb_property = param; this.type = 'urlHashParam'; }
			jbart.classes.urlHashParam.prototype.$jb_val = function(val) { return jb_urlHashParam(this.param,typeof val == 'undefined' ? undefined : jb_tostring(val)); }
			jbart.classes.urlHashParam.prototype.$jb_equals = function(other) { return other && other.type == this.type && other.param == this.param; }
			}
		return new jbart.classes.urlHashParam(param);
	}
});


jb_component('autoTest',{
	params: {
		page: { type: "control", dynamic: true },
		run: { type: "action", dynamic: true },
		expectedResult: { type: "expectedResult", dynamic: true, jstype: 'boolean' }
	},
	impl: function(context,page,run,expectedResult) {
		var wrapper = document.createElement('div');
		var control = page();
		jb_renderControl(control,wrapper);
		run(jb_ctx(context,{vars: { $control: control }}));

		return expectedResult(jb_ctx(context,{ data: wrapper}));
	}
});

jb_component('htmlContainsText',{
	params: {
		text: { jstype: 'array' }
	},
	impl: function(context,text) {
		var htmlText = context.data.innerHTML || context.data;
		for(var i=0;i<text.length;i++)
		  if (htmlText.indexOf(text[i]) == -1) return false;

		return true;
	}
});

jb_component('dynamicFields',{
	type: "control",
	params: {
		list: { jstype: 'array' },
		genericField: { type: 'control', dynamic: true }
	},
	impl: function(context,list,genericField) {
		return jb_map(list,function(item){ 
			return genericField(jb_ctx(context,{ vars: { fieldItem: item } }))
		});
	}
});

jb_component('slice',{
	params: {
		start: { jstype: 'number', defaultValue: 0 },
		end: { jstype: 'number' }
	},
	type: 'aggregator',
	impl: function(context,begin,end) {
		if (!context.data || !context.data.slice) return null;
		return end ? context.data.slice(begin,end) : context.data.slice(begin);
	}
});


jb_component('httpCall',{
	type: "data,action",
	params: {
		url: {},
		features: { type: 'httpFeature[]', dynamic:true }
	},
	impl: function(context,url,features) {
    var options = { url: url };
    features( jb_ctx(context, { vars: { $httpOptions: options } }));
    return $.when($.ajax(options));
	}
});

jb_component('contains',{
	type: 'boolean',
	params: {
		text: { jstype: 'array' },
		allText: {}
	},
	impl: function(context,text,allText) {
		if (!allText) return true;
		allText = allText.innerHTML || jb_tostring(allText);
		for(var i=0;i<text.length;i++)
		  if (allText.indexOf(jb_tostring(text[i])) == -1) return false;

		return true;
	}
});

jb_component('passesFilter',{
	type: 'aggregator',
	params: {
		filter: { type: "boolean", jstype: 'boolean', dynamic: true }
	},
	impl: function(context,filter) {
		var result = [];
		for(var i=0;i<context.data.length;i++)
			if (filter(jb_ctx(context,{ data: context.data[i] })))
				result.push(context.data[i]);
		return result;
	}
});

jb_component('count',{
	type: 'aggregator',
	impl: function(context,filter) {
		return context.data.length;
	}
});

jb_component('toUpperCase',{
	impl: function(context,filter) {
		return jb_tostring(context.data).toUpperCase();
	}
});

jb_component('join',{
	params: {
		separator: { jstype: 'string' }
	},
	type: 'aggregator',
	impl: function(context,separator) {
		var result = '';
		for(var i=0;i<context.data.length;i++)
			result += (i>0 ? separator : '') + jb_tojstype(context.data[i],'string');

		return result;
	}
});

jb_component('unique',{
	params: {
		id: { jstype: 'string', dynamic: true, defaultValue: '{{.}}' }
	},
	type: 'aggregator',
	impl: function(context,id) {
		var out = [];
		var soFar = {};
		for(var i=0;i<context.data.length;i++) {
			var itemId = id( jb_ctx(context, {data: context.data[i] } ));
			if (soFar[itemId]) continue;
			soFar[itemId] = true;
			out.push(context.data[i]);
		}
		return out;
	}
});

jb_component('log',{
	params: {
		obj: { jstype: 'object', defaultValue: '{{.}}'}
	},
	impl: function(context,obj) {
		if (typeof console != 'undefined' && console.log) console.log(obj);
		return context.data;
	}
});

jb_component('object',{
	impl: function(context) {
		var result = {};
		for(var i in context.profile)
			if (i.charAt(0) != '$') {
				result[i] = jb_run(jb_ctx(context,{profile: context.profile[i] }));
				var native_type = context.profile['$jsype_'+i];
				if (native_type)
					result[i] = jb_tojstype(result[i],native_type);
		}
		return result;
	}
});

jb_component('stringify',{
	params: {
		space: { jstype: 'string', description: 'use space or tab to make pretty output' }
	},
	impl: function(context,space) {
		if (typeof context.data == 'object')
			return JSON.stringify(context.data,null,space);
	}
});

jb_component('jbart', {
	params: {
		script: { description: 'jbart script to run' }
	},
	impl: function(context,script) {
		return jb_run(jb_ctx(context,{profile: script.$jb_object }))
	}
});
