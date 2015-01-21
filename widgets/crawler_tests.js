jb_tests('crawler_tests',{
'one step crawler': {
	$: 'dataTest',
	calculate: {
		$crawler: 
		{ $: 'crawlerQueue',
			httpCall: { $httpCall: 'https://storage.googleapis.com/letmesee1/i0chf3bk1v/roomHeaders_sjp0it164p.xml' },
			parser: { $extract: 'room id="', endMarker: '"' },
			action: { $:'addToCrawlerResults' }
		}
	},
	expectedResult: { $contains: '225pp9,chgmn4', allText: [ '{{results}}', { $join: ',' } ] }
}
});

jb_tests('crawler_tests',{
'two steps crawler': {
	$: 'dataTest',
	calculate: {
		$crawler: 
		[ { $: 'crawlerQueue',
				id: 'headers',
				httpCall: { $httpCall: 'https://storage.googleapis.com/letmesee1/i0chf3bk1v/roomHeaders_sjp0it164p.xml' },
				parser: [ { $extract: 'room id="', endMarker: '"'}, { $:'slice', start:0, end:2 } ],
				action: { $addToCrawlerQueue: 'room' }
			},
		{ $: 'crawlerQueue',
				id: 'room',
				httpCall: { $httpCall: 'https://storage.googleapis.com/letmesee1/i0chf3bk1v/rooms/{{$room}}.xml' },
				parser: { $extract: 'phone="', endMarker: '"' },
				action: { $:'addToCrawlerResults' } } ]
	},
	expectedResult: { $contains: ['052-2816064','050-6400260'],allText: [ '{{results}}', { $join: ',' } ] }
}
});
