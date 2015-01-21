jb_component('styleCustomCss',{
	type: '*',
	params: {
		cssClass: { jstype: 'string' }
	},
	impl: function(context,cssClass) {
		return jb_extend({},jbart.comps[context.parentParam.defaultValue.$].impl,{ cssClass: cssClass});

	}
});

jb_component('group',{
	type: "control",
	params: {
		title: {},
		style: { 
			type: "group.style", 
			defaultValue: {	$: "group.default" } 
		},
		controls: { type: "control[]", dynamic: true },
		features: { type: "feature[]", dynamic: true }
	},
	impl: function(context,title,style,controls) {
		return jb_control(context,{ controls: controls });
	}
});

jb_component('button',{
	type: "control",
	params: {
		text: { jstype: 'string' },
		action: { dynamic: true },
		style: { 
			type: "button.style", 
			defaultValue: {
				$: "button.default"
			}
		},
		features: { type: "feature[]", dynamic: true }
	},
	impl: function(context,text,action) {		
		return jb_control(context,{ text: text, action: action });
	}
});

jb_component('propertySheet',{
	type: "control",
	params: {
		title: {},
		style: { 
			type: "propertySheet.style", 
			defaultValue: {	$: "propertySheet.default" } 
		},
		controls: { type: "control[]", dynamic: true },
		features: { type: "feature[]", dynamic: true }
	},
	impl: function(context,title,style,controls) {
		return jb_control(context,{ controls: controls() });
	}
});

jb_component('label',{
	type: "control",
	params: {
		title: { jstype: 'string' },
		databind: { description: 'if empty, the title is used', dynamic: true, noCompress: true }, // noCompress is used because of jb_profileHasValue(profile,'text'). so the name 'text' will remain also after the compress
		style: { 
			type: "label.style", 
			defaultValue: {	$: "label.simpleText"	}
		},
		features: { type: "feature[]", dynamic: true }
	},
	impl: function(context,title,databind) {		
		return jb_control(context,{
			text: jb_profileHasValue(context,'databind') ? jb_tostring(databind()) : title
		});
	}
});

jb_component('editableText',{
	type: "control",
	params: {
		title: { jstype: 'string' },
		databind: { jstype: 'object' },
		style: { 
			type: "editableText.style", 
			defaultValue: {
				$: "editableText.textbox"
			}
		},
		features: { type: "feature[]", dynamic: true }
	},
	impl: function(context,title,databind) {		
		return jb_control(context,{ databind: databind });
	}
});

jb_component('refresh',{
	type: 'action',
	params: {
		control: { jstype: 'string' }
	},
	impl: function(context,control) {
		jb_refreshControl(control,context.vars.$control.el);
	}
});


jb_component('image',{
	type: "control",
	params: {
		databind: { jstype: 'string' },
		imageWidth: { jstype: 'number' },
		imageHeight: { jstype: 'number' },
		width: { jstype: 'number' },
		geight: { jstype: 'number' },
		style: { 
			type: "image.style", 
			defaultValue: {	$: "image.default" }
		},
		features: { type: "feature[]", dynamic: true }
	},
	impl: function(context,databind,imageWidth,imageHeight,width,height) {
		return jb_control(context,{
			databind: databind, imageWidth: imageWidth, imageHeight: imageHeight, width: width, height: height
		});
	}
});

