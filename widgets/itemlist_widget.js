jb_resource('itemlist_widget','simpsons',{
	characters: [
	  { name: "Homer Simpson", voice: "Dan Castellaneta", image: '//upload.wikimedia.org/wikipedia/en/thumb/0/02/Homer_Simpson_2006.png/212px-Homer_Simpson_2006.png' },
	  { name: "Bart Simpson", voice: "Nancy Cartwright", image: '//upload.wikimedia.org/wikipedia/en/a/aa/Bart_Simpson_200px.png' },
	  { name: "Marge Simpson", voice: "Julie Kavner", image: '//upload.wikimedia.org/wikipedia/en/thumb/0/0b/Marge_Simpson.png/220px-Marge_Simpson.png' }
	]
});

jb_component("itemlist_widget.main", {
	type: "control",
	impl: {
		$: "itemlist",
		items: '{{$simpsons.characters}}',
		itemVariable: 'person',
		controls: [
		  {	$: "label", databind: "{{name}}"},
		 ]
	}
});

jb_tests('itemlist_widget',{
	'simple': { 
		$: "autoTest", 
		page: {	$: "itemlist_widget.main" },
		expectedResult: { $: "htmlContainsText", text: { $: 'list', items: [ "Homer Simpson", "Marge Simpson" ] } }
	}
});


