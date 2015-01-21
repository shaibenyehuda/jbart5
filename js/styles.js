/*********** label ******************/

jb_type('label.style');

jb_component('label.simpleText',{
	type: 'label.style',
	impl: function() {
		return {
			html: '<label/>',
			cssClass: "jb-label",
			onload: function(uiText) {
				jb_uiText(uiText);
			}
		}
	}
});

/*********** editable text ******************/

jb_type('editableText.style');

jb_component('editableText.textbox',{
	type: 'editableText.style',
	impl: function() {
		return {
			html: '<input/>',
			css: ".jb-textbox { font: 12px arial; display: block; }",
			cssClass: "jb-textbox",
			onload: function(textbox) {
				jb_textbox(textbox);
			}
		}
	}
});

/*********** group ******************/

jb_type('group.style');

jb_component('group.default',{
	type: 'group.style',
	impl: function() {
		return {
			html: '<section />',
			cssClass: "jb-group",
			onload: function(group) {
				jb_group(group);
			}
		}
	}
});

/*********** propertySheet ******************/

jb_type('propertySheet.style');

jb_component('propertySheet.default',{
	type: 'propertySheet.style',
	impl: function() {
		return {
			html: '<div><div class="property"><div class="property-title"/><div class="property-content" /></div></div>',
			cssClass: "jb-propertySheet",
			onload: function(propSheet) {
				jb_propertySheet(propSheet);
			}
		}
	}
});

/*********** image ******************/

jb_type('image.style');

jb_component('image.default',{
	type: 'image.style',
	impl: function() {
		return {
			html: '<div/>',
			cssClass: "jb-image",
			onload: function(image) {
				jb_image(image);
			}
		}
	}
});

/*********** button ******************/

jb_type('button.style');

jb_component('button.default',{
	type: 'button.style',
	impl: function() {
		return {
			html: '<button/>',
			cssClass: "jb-btn-default",
			onload: function(button) {
				jb_button(button);
			}
		}
	}
});

