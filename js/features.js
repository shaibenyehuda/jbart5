jb_component('refreshControlOnUpdate',{
	type: 'feature',
	params: {
		controlID: { jstype: 'string' }
	},
	shortcut: { name: 'refreshOnUpdate', mainParam: 'controlID' },
	impl: function(context,controlID) {
		jb_bind(context.vars.$control,'update',function() {
			jb_refreshControl(controlID,context.vars.$control.el);
		});
	}
});

jb_component('controlID',{
	type: 'feature',
	params: {
		id: { jstype: 'string' }
	},
	shortcut: { name: 'id', mainParam: 'id' },
	impl: function(context,id) {
		context.vars.$control.id = id;
	}
});

jb_component('onload',{
	type: 'feature',
	params: {
		action: { type: 'action', dynamic: true }
	},
	shortcut: { name: 'onload', mainParam: 'action' },
	impl: function(context,action) {
		jb_bind(context.vars.$control,'render',function() {
			action();
		});
	}
});

jb_component('onclick',{
	type: 'feature',
	params: {
		action: { type: 'action', dynamic: true }
	},
	shortcut: { name: 'onclick', mainParam: 'action' },
	impl: function(context,action) {
		jb_bind(context.vars.$control,'render',function() {
			context.vars.$control.$el.click(function() { 
				action();
			});
		});
	}
});

jb_component('prepare',{
	type: 'feature',
	params: {
		action: { type: 'action', dynamic: true },
		loadingControl: { type: 'control', defaultValue: { $label: 'loading...' } }
	},
	impl: function(context,action,loadingControl) {
		var control = context.vars.$control;
		control.loadingControl = loadingControl;
		control.prepare = action;
	}
});

jb_component('autoRefresh',{
	type: 'feature',
	params: {
		databind: { jstype: 'object' }
	},
	shortcut: { name: 'autoRefresh' },
	impl: function(context,databind) {
		var control = context.vars.$control;
		jb_bind(control,'render',function() {
			jb_observe(databind,control.$el[0],function() {
				jb_refreshControl(control);
			});
		});
	}
});

