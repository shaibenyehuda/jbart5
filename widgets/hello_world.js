jb_resource('hello_world','person',{
	"name": "Homer Simpson",
	"age": 40,
	children: [ { name: 'Bart'}, { name: 'Lisa' }, { name: 'Meggy' }]
});

jb_resource('hello_world','fields',[
	{ fieldName: 'name' },
	{ fieldName: 'age' }
]);

jb_component("hello_world.main",{
	type: "control",
	impl: {
		$: "group", title: "main",
		controls: [
		  {	$: "label", title: "hello", databind: "Hello {{$person.name}}", id: 'label1' },
		  {	$: "editableText", title: "textbox", databind: "{{$person.name}}", id: 'edit name', refreshOnUpdate: 'label1' },
		  {	
		  	$: "label", title: "hello2",
		  	databind: ["{{$person.name}}" , "in pipeline: {{}}"]
		  },
		  {
			$: "propertySheet",
			controls: [
			  {	$: "editableText", title: "name", databind: "{{$person.name}}", id:'name', 
			  	refreshOnUpdate: { controlID: 'label1' } },
			  {	$: "editableText", title: "age", databind: "{{$person.age}}" }
			]
		  },
		  {	$: "label", databind: "{{=count($person.children)}} children"},
		  {	$: "label", databind: function(context) {
		  	return 'In 10 years I will be ' + (context.resources.person.age+10);
		  } }
		 ]
	}	
});

jb_component("hello_world.prepare",{
	type: 'control',
	impl: {
		$: "group", title: "main",
		features: {
			$: 'prepare',
			action: function(context) {
				var deferred = $.Deferred();
				setTimeout(deferred.resolve,3000);
				return deferred.promise();
			},
			loadingControl: { $label: 'waiting for 3sec timeout...' }
		},
		controls: [
		  {	$: "label", title: "hello", databind: "Loaded" }
		]
	}
});

jb_component("hello_world.dynamicFields",{
	type: "control",
	impl: {
			$: "propertySheet",
			controls: [
			  {	
			  	$: "dynamicFields", list: '{{$fields}}',
			    genericField: {
			    	$: 'editableText', title: '{{$fieldItem.fieldName}}',
			    	databind: { $:'jsonPath', parent: '{{$person}}', path: '{{$fieldItem.fieldName}}' }
			    }
			  }
			]
	}
});

jb_tests('hello_world',{
	'simple test': { 
		$: "autoTest", 
		page: {	$: "hello_world.main" },
		expectedResult: { $: "htmlContainsText", text: "Hello" }
	},
	'expression with text': { 
		$: "autoTest", 
		page: {	$: "hello_world.main" },
		expectedResult: { $: "htmlContainsText", text: "Hello Homer" }
	},
	'pipeline': { 
		$: "autoTest", 
		page: {	$: "hello_world.main" },
		expectedResult: { $: "htmlContainsText", text: "in pipeline: Homer Simpson" }
	},
	'refresh control on update': { 
		$: "autoTest", 
		page: {	$: "hello_world.main" },
		run: { $: 'setText', text: 'new homer', controlID: 'edit name' },
		expectedResult: { $: "htmlContainsText", text: "Hello new homer" }
	},
	'shortcut with object': { 
		$: "autoTest", 
		page: {	$: "hello_world.main" },
		run: { $: 'setText', text: 'Marge', controlID: 'name' },
		expectedResult: { $: "htmlContainsText", text: "Hello Marge" }
	},
	'count': { 
		$: "autoTest", 
		page: {	$: "hello_world.main" },
		expectedResult: { $: "htmlContainsText", text: "3 children" }
	},
	'property sheet': {
		$: "autoTest", 
		page: {	$: "hello_world.main" },
		expectedResult: { $: "htmlContainsText", text: "name:" }
	},
	'dynamic fields': {
		$: "autoTest", 
		page: {	$: "hello_world.dynamicFields" },
		expectedResult: { $: "htmlContainsText", text: { $: 'list', items: [ "name:", "age:" ] } }
	},
	'using resources from js': {
		$: "autoTest", 
		page: {	$: "hello_world.main" },
		expectedResult: { $htmlContainsText: "I will be 50" }
	},
	'prepare': {
		$: "autoTest", 
		page: {	$: "hello_world.prepare" },
		expectedResult: { $htmlContainsText: "waiting for 3sec timeout..." }		
	}
});

