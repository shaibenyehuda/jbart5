jb_type('crawlerQueue');
jb_type('crawlerFeature');

jb_component('crawlerQueue',{
	type: 'crawlerQueue',
	params: {
		httpCall: { dynamic: true, defaultValue: '{{.}}' },
		id: { jstype: 'string' },
		parser: { dynamic: true, defaultValue: '{{.}}' },
		action: { type: 'action', dynamic:true }
	},
	impl: function(context, httpCall, id, parser, action) {
		var crawlerContext = context.vars.crawlerContext;
		if (!id)
			id = crawlerContext.count = (crawlerContext.count || 0) +1;
		crawlerContext.queues[id] = crawlerContext.queues[id] || { items: [] };

		crawlerContext.queues[id].processItem = function(queueItem) {
			var vars = {};
			vars[id] = queueItem;
			var callObj = httpCall( jb_ctx(context, { data: queueItem, vars: vars }) );
			return $.when(callObj).then( function(response) {
				var result = parser( jb_ctx(context, { data: response, vars: vars }) );
				action( jb_ctx(context,{ data:result, vars: vars }) );
			}, function(err) { crawlerContext.logs.err.push(err); } );
		}
	}
});

jb_component('crawler',{
	params: {
		queues: { type: 'crawlerQueue[]', dynamic: true },
		features: { type: 'crawlerFeature[]', dynamic: true },
		queueItems: { jstype:'object' }
	},
	impl: function(context, queues, features, queueItems) {
		var crawlerContext = { results: [], queues: {}, logs: { err: [], http: [] } };
		var ctx = jb_ctx( context, { vars: { crawlerContext: crawlerContext } });
		features(ctx);
		queues(ctx);

		jb_map(queueItems, function(items,name) {
			if (!crawlerContext.queues[name])
				crawlerContext.queues[name] = {};
			crawlerContext.queues[name].items = jb_toarray(items);
		});
		if (!jb_map(crawlerContext.queues, function(queue) { return queue.items; }).length && Object.keys(crawlerContext.queues).length)	// all queues are empty
			crawlerContext.queues[Object.keys(crawlerContext.queues)[0] ].items = [null];	// adding empty value to the first queue

		var deferred = $.Deferred();
		process(deferred);
		return deferred.promise();

		function process(deferred) {
			for (var id in crawlerContext.queues)
				if (crawlerContext.queues[id].items.length && crawlerContext.queues[id].processItem) {
					var queueItem = crawlerContext.queues[id].items.splice(0,1);
					return $.when(crawlerContext.queues[id].processItem(queueItem)).then(function() { process(deferred) }, 
						function() { crawlerContext.logs.err.push('crawler error:' + id) });
				}
			deferred.resolve(crawlerContext);	// all queues are empty
		}
	}
});

jb_component('addToCrawlerResults',{
	params: { 
		items: { jstype: 'array', defaultValue: '{{.}}' } 
	},
	impl: function(context, items) {
		for (var i=0; i<items.length; i++) {
			context.vars.crawlerContext.results.push(items[i]);
			jb_trigger(context.vars.crawlerContext, 'resultAdded', items[i]);
		}
	}
});

jb_component('addToCrawlerQueue',{
	params: { 
		queue: { jstype: 'string' },
		items: { jstype: 'array', defaultValue: '{{.}}' } 
	},
	impl: function(context, queue, items) {
		var queues = context.vars.crawlerContext.queues;
		if (!queues[queue]) queues[queue] = { items: [] };
		var queueItems = queues[queue].items;
		for (var i=0; i<items.length; i++)
			queueItems.push(items[i]);
	}
});

jb_component('writeResultsToFile',{
	type: 'crawlerFeature',
	params: {
		file: { jstype: 'string' },
		append: { type:'boolean', jstype: 'boolean' },
		keepOrder: { type:'boolean', jstype: 'boolean', description: 'may slow the crawler' }
	},
	shortcut: { name: 'resultsFile', mainParam: 'file' },
	impl: function(context, file, append, keepOrder) {
		if (typeof(GLOBAL) != 'undefined' && !GLOBAL.fs)
			GLOBAL.fs = require('fs');

		if (!append) fs.writeFileSync(file ,''); // emptying the file

		jb_bind(context.vars.crawlerContext,'resultAdded', function(result) {
			var str = typeof(result) == 'string' ? result : JSON.stringify(result);
			var appendFunc = keepOrder ? fs.appendFileSync : fs.appendFile;
			appendFunc(file, str + '\n');
		});
	}
});

jb_component('simulateBrowserRequest',{
	type: 'httpFeature',
	shortcut: { name: 'simulateBrowserRequest'},
	impl: function(context) {
		var options = context.vars.$httpOptions;
		if (!options || typeof(GLOBAL) == 'undefined') return;	// relevant for nodejs only
		options.headers = $.extend(
			{ 'user-agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36' },
			options.headers);
	}
});

jb_component('jbartProxy',{
	type: 'httpFeature',
	params : { 
		onlyFromBrowser: { type:'boolean', jstype:'boolean'}
	},
	shortcut: { name: 'jbartProxy'},
	impl: function(context, onlyFromBrowser) {
		var options = context.vars.$httpOptions;
		if (typeof(GLOBAL) != 'undefined' && onlyFromBrowser) return;
		options.url = '//jbartcrawler.herokuapp.com/?op=httpCall' + '&url=' + encodeURIComponent(options.url);
	}
});
