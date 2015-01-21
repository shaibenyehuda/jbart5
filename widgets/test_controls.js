jb_component("test_controls.main",{
	type: "control",
	impl: {
		$: "group", 
		controls: [
		  {	$: "label", databind: "my custom css class", style: 'my-css-class' },
		  {	$: "label", databind: "text of style with params", 
		    style: { $: 'test_controls.labelStyleWithParam', prefix: 'prefixInStyle:'}
		  },
		  {	$: "label", databind: "my custom html", 
		    style: function() { 
		    	return {
		    		html: '<span>very specific html</span>',
		    		onload: function(control) {
		    			control.$el.text(control.$el.text()+'1');
		    		}
		    	}
		    }
		  },
		  { $: 'image', databind: 'img/studio/jb_64x64.png' },
		  { $: 'button', text: 'click me', 
		  	action: function(context) {
		  		alert('button clicked');
		  	}
		  },
		 ]
	}	
});


jb_component('test_controls.labelStyleWithParam',{
	type: 'label.style',
	params: {
		prefix: { jstype: 'string' }
	},
	impl: function(context,prefix) {
		return {
			html: '<label/>',
			onload: function(control) {
				control.$el.text(prefix + control.text);
			}
		}
	}
});



jb_tests('test_controls',{
	'style custom css class': { 
		$: "autoTest", 
		page: {	$: "test_controls.main" },
		expectedResult: { $: "htmlContainsText", text: "my-css-class" }
	},
	'style custom html': { 
		$: "autoTest", 
		page: {	$: "test_controls.main" },
		expectedResult: { $: "htmlContainsText", text: "<span>very specific html1</span>" }
	},
	'image': {
		$: "autoTest", 
		page: {	$: "test_controls.main" },
		expectedResult: { $: "htmlContainsText", text: "img/studio/jb_64x64.png" }
	},
	'button': {
		$: "autoTest", 
		page: {	$: "test_controls.main" },
		expectedResult: { $: "htmlContainsText", text: "click me" }
	},
	'styleParams': {
		$: "autoTest", 
		page: {	$: "test_controls.main" },
		expectedResult: { $: "htmlContainsText", text: "prefixInStyle:text of style with params" }
	}
});

