jb_resource('data_tests','people',[
	{	"name": "Homer Simpson"	,age: 42 , male: true},
	{	"name": "Marge Simpson"	,age: 38 , male: false},
	{	"name": "Bart Simpson"	,age: 12 , male: true}
]);

jb_resource('data_tests','person',{ "name": "Homer Simpson"	});

jb_resource('data_tests','personWithAddress',{ 
	"name": "Homer Simpson", 
	"address": {
		"city": "springfield",
		"street": "742 Evergreen Terrace"
	}
});

jb_tests('data_tests',{
	// 'httpCall': {
	// 	$: "dataTest", 
	// 	calculate: {$: 'httpCall', url: '//jbartcrawler.herokuapp.com/?op=httpCall&url=http://www.google.com' },
	// 	expectedResult: { $htmlContainsText: 'google' }
	// },
	'pipeline': { 
		$dataTest: {$: 'pipeline', items: ['{{$person}}' , '{{name}}'] } ,
		expectedResult: '{{}} ^= Homer'
	},
	'double pipeline': { 
		$dataTest: ['{{$person}}' , ['{{name}}'] ]  ,
		expectedResult: '{{}} ^= Homer'
	},
	'pipeline with sugar': { 
		$dataTest: ['{{$person}}' , '{{name}}'] ,
		expectedResult: '{{}} ^= Homer'
	},
	'pipeline2': { 
		$dataTest: ["{{$person.name}}" , "in pipeline: {{}}"] ,
		expectedResult: '{{}} ^= in pipeline: Homer'
	},
	'expression': { 
		$dataTest: '{{$person.name}}',
		expectedResult: '{{}} ^= Homer'
	},
	'filter': { 
		$dataTest: ['{{$people}}', {$filter: '{{age}} < 30'}, {$: 'count'} ],
		expectedResult: '{{}} == 1'
	},
	'bool_expression': { 
		$dataTest: ['{{$people}}', {$filter: '{{male}}'}, {$: 'count'} ],
		expectedResult: '{{}} == 2'
	},
	'bool_expression_not_operator': { 
		$dataTest: ['{{$people}}', {$filter: '!{{male}}'}, {$: 'count'} ],
		expectedResult: '{{}} == 1'
	},
	'bool_expression_not_operator2': { 
		$dataTest: ['{{$people}}', {$filter: '!{{age}} < 30'}, '{{name}}' , {$join : ', '} ],
		expectedResult: '{{}} == Homer Simpson, Marge Simpson'
	},
	'startsWith': { 
		$dataTest: ['{{$people}}', {$filter: '{{name}} ^= Homer'}, {$: 'count'} ],
		expectedResult: '{{}} == 1'
	},
	'endsWith': { 
		$dataTest: ['{{$people}}', {$filter: '{{name}} $= t Simpson'}, {$: 'count'} ],
		expectedResult: '{{}} == 1'
	},
	'javascript code': { 
		$dataTest: [
			'{{$people}}', 
			function(context) { return context.data.name.toLowerCase(); },
			{$join: ', '}
		],
		expectedResult: '{{}} == homer simpson, marge simpson, bart simpson'
	},
	'same': { 
		$dataTest: ['{{$people}}', '{{}}' , {$: 'count'} ],
		expectedResult: '{{}} == 3'
	},
	'parent': {
		$dataTest: ['{{$personWithAddress.address}}', '{{.$parent.name}}' ],
		expectedResult: '{{}} == Homer Simpson'
	},
	'variable': {
		$dataTest: { $: 'pipeline', $vars: { myvar: 'value of variable' } , items: [ '{{$myvar}}' ] },
		expectedResult: '{{}} == value of variable'
	},
	'unique': {
		$: 'dataTest',
		calculate: [
			{ $list: [1,2,3,2] },
			{ $:'unique' },
			{ $join: '-' }
		],
		expectedResult: '{{.}} == 1-2-3'
	},
	'boolean': {
		$: 'dataTest',
		calculate: [
			{ $list: [1,true,false] },
			{ $filter: '{{.}}'},
			{ $: 'count' }
		],
		expectedResult: '{{.}} == 2'
	}
});


