jb_component('studio.editPageSource',{
	type: 'action',
	impl: {
		$: 'openPopup',
		style: 'popup.studioFloating',
		content: {
			$: 'editableText',
			databind: { $: 'studio.jbartScriptSource',
				jbartScript: function() {
					return jbart.comps[jb_urlHashParam('studioPage')].impl;
				},
				style: { $: 'editableText.codeMirror', type: 'js' }
			}
		}
	}
});

jb_component('openPopup',{
	type: 'action',
	params: {
		style: { type: 'popup.style', defaultValue: 'popup.default' },
		content: { type: 'control', dynamic: true },
		features: { type: 'popupFeature[]', dynamic: true }
	},
	impl: function(context,style,features) {
		// what are my options?
		// 1. treat popup like one treats a regular control, and let the style put it under 'body'. the features work similar to control features
		// 2. copy the mechanism of control

		// what about popups in picklist style? we can put the css of popup_<cssClass> in the popup, so the css will just work. and in the js it can reuse some code...
	}
});

jb_component('popup.default',{
	type: 'popup.style',
	impl: function() {
		return {
			html: '<div/>',
			cssClass: 'popup_default',
			onload: function(popup) {
				jb_popup(popup);
			}
		}
	}
});

function jb_popup(popup) {
	jb_renderControl(popup.content(),popup.$el.find('.content')[0]);
	$('body').find('>.jbart_popups').append(popup.$el);

	jb_trigger(popup,'attach');


}