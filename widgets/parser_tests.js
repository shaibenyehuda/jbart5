jb_resource('parser_tests','html','<div class="s9hl" style="position: relative">\
			<a href="/gp/product/159420571X/ref=s9_al_bw_g14_i1?pf_rd_m=ATVPDKIKX0DER&amp;pf_rd_s=merchandised-search-3&amp;pf_rd_r=17MV8SNA0JJSCFBG8X4A&amp;pf_rd_t=101&amp;pf_rd_p=1968762882&amp;pf_rd_i=10207069011" class="title ntTitle noLinkDecoration" title="Everything I Never Told You: A Novel">\
			<div class="s9ImageWrapper"><div class="imageContainer"><img onload="window.uet &amp;&amp; uet.call &amp;&amp; uet(&quot;cf&quot;);" src="http://ecx.images-amazon.com/images/I/51bE9al6SPL._SY160_.jpg" alt="" width="106" height="160"></div>\
			</div><span class="s9TitleText">Everything I Never Told You: A Novel</span></a>\
			<div class="t11"><span class="carat">›</span><a class="noLinkDecoration" href="/Celeste-Ng/e/B00G3OK1NI/ref=s9_al_bw_al1?pf_rd_m=ATVPDKIKX0DER&amp;pf_rd_s=merchandised-search-3&amp;pf_rd_r=17MV8SNA0JJSCFBG8X4A&amp;pf_rd_t=101&amp;pf_rd_p=1968762882&amp;pf_rd_i=10207069011">Celeste Ng</a></div>\
			<div class="s9DFSpacer" style="padding: 1px;"></div>\
			<div class="s9CustomerReviews"><div class="s9Stars s9Stars_4_0"></div><span>(<a class="noLinkDecoration" href="/gp/product-reviews/159420571X/ref=s9_al_bw_rs1?ie=UTF8&amp;showViewpoints=1&amp;pf_rd_m=ATVPDKIKX0DER&amp;pf_rd_s=merchandised-search-3&amp;pf_rd_r=17MV8SNA0JJSCFBG8X4A&amp;pf_rd_t=101&amp;pf_rd_p=1968762882&amp;pf_rd_i=10207069011">809<span class="s9Long"> customer reviews</span></a>)</span></div><div class="t11">\
			<a href="/gp/product/159420571X/ref=s9_al_bw_g14_i1?pf_rd_m=ATVPDKIKX0DER&amp;pf_rd_s=merchandised-search-3&amp;pf_rd_r=17MV8SNA0JJSCFBG8X4A&amp;pf_rd_t=101&amp;pf_rd_p=1968762882&amp;pf_rd_i=10207069011" class="noLinkDecoration" title="Everything I Never Told You: A Novel - Hardcover">Hardcover</a>: <span class="s9Price red t14">$15.22</span></div><div class="t11">\
			<a href="/gp/product/B00G3L7V0C/ref=s9_al_bw_g351_i1?pf_rd_m=ATVPDKIKX0DER&amp;pf_rd_s=merchandised-search-3&amp;pf_rd_r=17MV8SNA0JJSCFBG8X4A&amp;pf_rd_t=101&amp;pf_rd_p=1968762882&amp;pf_rd_i=10207069011" class="noLinkDecoration" title="Everything I Never Told You: A Novel - Kindle Edition">Kindle Edition</a>: \
			<span class="s9Price red t14">$12.99</span></div></div>');

jb_tests('parser_tests',{
		'extract: Regex': { 
			$dataTest: [ '{{$html}}', 
				{$extract: ['class="s9Long"', '[Tt]itle="'], endMarker: '"' ,regex: true}
			],
			expectedResult: '{{}} == Everything I Never Told You: A Novel - Hardcover'
		},
		'extract: multi': { 
			$dataTest: [ '123456789 123456789 123456789', 
				{$extract: ['1', '4'], endMarker: '8'},
				{$join: ','} 
			],
			expectedResult: '{{}} == 567,567,567'
		},
		'extract: onlyFirstResult': { 
			$dataTest: [ '123456789 123456789 123456789', 
				{$extract: ['1', '4'], endMarker: '8', onlyFirstResult: true},
				{$join: ','} 
			],
			expectedResult: '{{}} == 567'
		},
		'extract: keepStartMarker': { 
			$dataTest: [ '123456789 123456789 123456789', 
				{$extract: ['1', '4'], endMarker: '8', keepStartMarker: true},
				{$join: ','} 
			],
			expectedResult: '{{}} == 4567,4567,4567'
		},
		'extract: keepEndMarker': { 
			$dataTest: [ '123456789 123456789 123456789', 
				{$extract: ['1', '4'], endMarker: '8', keepEndMarker: true},
				{$join: ','} 
			],
			expectedResult: '{{}} == 5678,5678,5678'
		},
		'match: multi-line & global': { 
			$dataTest: [ '{{$html}}',
				{$match: '[Tt]itle="[^"]*"', flags: 'mg'},
				{$join: ','}
			],
			expectedResult: '{{}} == title="Everything I Never Told You: A Novel",title="Everything I Never Told You: A Novel - Hardcover",title="Everything I Never Told You: A Novel - Kindle Edition"'
		},
		'match as filter': { 
			$dataTest: [ 
				{ $list: ['Hi John', '123 Hi'] },
				{ $match: 'Hi.*', matchWholeText:true },
				{ $join: ',' }
			],
			expectedResult: '{{}} == Hi John'
		},
		'extractPrefix': { 
			$dataTest: [ 'title="Everything I =Never Told You"', {$:'extractPrefix', separator: '='} ],
			expectedResult: '{{}} == title'
		},
		'extractSuffix': { 
			$dataTest: [ 'title="Everything I =Never Told You',	{$:'extractSuffix', separator: '='}	],
			expectedResult: '{{}} == Never Told You'
		},
		'extractPrefix regex': { 
			$dataTest: [ 'title="Everything I =Never Told You"', {$:'extractPrefix', separator: '=', regex: true} ],
			expectedResult: '{{}} == title'
		},
		'extractSuffix regex': { 
			$dataTest: [ 'title="Everything I =Never Told You', {$:'extractSuffix', separator: '=', regex: true} ],
			expectedResult: '{{}} == Never Told You'
		},
		'$object - (dynamic json)': { 
			$dataTest: [ '{{$html}}',
				{$:'object', 
						title: {$extract: ['title="'], endMarker: '"' },
						price: {$extract: ['s9Price', '>'], endMarker: '<' }
				},
				'{{title}}:{{price}}'
			],
			expectedResult:'{{}}  == Everything I Never Told You: A Novel:$15.22'
	  },
	  'stringify': { 
			$dataTest: [ '{{$html}}',
				{$:'object', 
						title: {$extract: ['title="'], endMarker: '"' },
						price: {$extract: ['s9Price', '>'], endMarker: '<' }
				},
				{$stringify :' '},
			],
			expectedResult:'{{}} ^= {'
	  },
		'match with group': { 
			$dataTest: [ '{{$html}}',
				{$match: 's9TitleText\">([^<]*)</span>', group: 1}
			],
			expectedResult: '{{.}} == Everything I Never Told You: A Novel'
		},
		'split': { 
			$: 'dataTest',
			calculate: [ 'This is my ball', { $split: ' ' }, { $join: '-' } ],
			expectedResult: '{{.}} == This-is-my-ball'
		},
		'extractPrefix with split': { 
			$dataTest: [ 'title="Everything I =Never Told You"', { $split:"=" }, {$:'slice', end:1 } ],
			expectedResult: '{{.}} == title'
		},
		'extractPrefix with split keep separator': { 
			$dataTest: [ 'title="Everything I =Never Told You"', { $match: '[^=]*=', returnAllForNoMatch: true } ],
			expectedResult: '{{.}} == title='
		},
		'extractPrefix with split keep separator no match': { 
			$dataTest: [ 'Never Told You', { $match: '[^=]*=', returnAllForNoMatch: true, $break:true } ],
			expectedResult: '{{.}} == Never Told You'
		},
		'extractSuffix with split': { 
			$dataTest: [ 'title="Everything I =Never Told You', {$split:"="}, {$slice: -1} ],
			expectedResult: '{{.}} == Never Told You'
		},
});


