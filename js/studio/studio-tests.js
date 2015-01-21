jb_component("studio.allTests", {
	impl: {
		$: 'group',
		style: 'studio-allTests-main-group',
		features: [{
			$: 'prepare',
			action: { $: 'studio.runAllTests'},
			loadingControl: { $: 'label', databind: 'Running jbart tests...', style: 'studio-allTests-running' }
		}],
		controls: [
		{
			$: "label", style: 'studio-allTests-label',
			features: [ { $: "studio.testLabelFeature"}	]
		},
		{
			$: "itemlist",
			items: "{{$widgets.*.tests.*}}",
			itemVariable: "test",
			style: 'studio-allTests',
			itemSelection: {
				bindSelection: { $urlHashParam: 'test' },
				itemid: '{{=name($test.$parent.$parent)}},{{=name($test)}}'
			},
			controls: [{
				$: "label", databind: '{{=name($test.$parent.$parent)}}: {{=name($test)}}',
				style: 'studio-allTest-testName',
				features: [{
					$: 'studio.showTestResultFeature',
					widgetName: "{{=name(.$parent.$parent)}}",
					testName: "{{=name($test)}}"
				}]
			}]
		}, 
		{
			$: "label",	id: 'studio widget name',
			databind: { 
				$: 'replace', text: {$urlHashParam: 'test' }, find: ',', replace: ' : ', useRegex: true, regexFlags: '' 
			},
			autoRefresh: { databind: { $urlHashParam: 'test'} },
			style: 'studio-allTests-widget-label'
		},
		{
			$: 'group', id: 'studio show widget', style: 'studio-allTests-widget',
			autoRefresh: { databind: { $urlHashParam: 'test'} },
			controls: [{
				$: 'studio.showTestResultControl',
				test: { '$studio.testByFullName': { $urlHashParam: 'test' } }
			}]
		}]
	}
});

jb_component('studio.runAllTests', {
	type: 'action',
	impl: function(context) {
		jbart.settings = $.extend({ testTimeout: 2000 }, jbart.settings);

		var deferred = $.Deferred();
		var tests = jb_expression('{{$widgets.*.tests.*}}',context,'array');
		var lastRun = new Date().getTime();

		runNextTest(0);

		return deferred.promise();

		function runNextTest(testIndex) {
			if (testIndex == tests.length) 
				return deferred.resolve();

			if (new Date().getTime() - lastRun > jbart.settings.testTimeout) {
				lastRun = new Date().getTime();
				return setTimeout(function() { runNextTest(testIndex); },20);	// don't take too much CPU at once
			}

			var widget = jb_expression('{{.$parent.$parent}}',jb_ctx(context,{data: tests[testIndex]}),'object');
			var testName = tests[testIndex].$jb_property;
			var widgetName = widget.$jb_property;
			var resultPath = ['testResults',widgetName,testName];
			var testResult = jb_path(jbart,resultPath,{});

			$.when(jb_studio_runTest(widget, tests[testIndex])).then(function(passed) {
				if (!testResult.timedOut) {
					testResult.passed = passed;
					testResult.completed = true;
					runNextTest(testIndex+1);
				}
			},function() {
				if (!testResult.timedOut) {
					testResult.passed = false;
					testResult.completed = true;
					runNextTest(testIndex+1);
				}
			});

			setTimeout(function() {
				if (!testResult.completed) {
					testResult.passed = false;
					testResult.timedOut = true;
					runNextTest(testIndex+1);
				}
			},2000);

		}
	}
});


jb_component('studio.testByFullName', {
	type: 'data',
	params: {
		fullName: { jstype: 'string' }
	},
	impl: function(context,fullName) {
		if (fullName.indexOf(',')==-1) return;
		var widgetName = fullName.split(',')[0];
		var testName = fullName.substr(widgetName.length+1);		
		return widgetName && testName && jbart_widgets[widgetName].tests[testName];
	}
});

jb_component('studio.testLabelFeature', {
	type: 'feature',
	impl: function(context, widgetName, testName) {
		jb_bind(context.vars.$control, 'render', function() {
			var passCount=0,failCount=0;
			var results = jb_expression('{{testResults.*.*}}',jb_ctx(context, {data: jbart }));
			for(var i=0;i<results.length;i++)
				if (results[i].passed) passCount++; else failCount++;

			context.vars.$control.$el.text(failCount == 0 ? 'all jbart tests pass (' + passCount + ')' : failCount + ' jbart tests fail');
			if (failCount > 0)
				context.vars.$control.$el.addClass('failed');
		});
	}
});

jb_component('studio.showTestResultFeature', {
	type: 'feature',
	params: {
		widgetName: {},
		testName: {}
	},
	impl: function(context, widgetName, testName) {
		jb_bind(context.vars.$control, 'render', function() {
			var result = jb_path(jbart,['testResults',widgetName,testName]);
			if (result)
				context.vars.$control.$el.addClass(result.passed ? 'passed' : 'failed');
		});
	}
});

jb_component('studio.showTestResultControl', {
	type: 'control',
	params: {
		test: { jstype: 'object' },
		features: {
			type: "feature[]",
			dynamic: true
		}
	},
	impl: function(context,test,features) {
		if (!test) return;
		var widget = test.$jb_parent.$jb_parent;

		var ctx = jb_ctx();

		for (var compName in widget.components || {}) jb_component(compName, widget.components[compName]);

		// global resources
		for (var resourceName in widget.resources || {})
			ctx.resources[resourceName] = widget.resources[resourceName];

		var $el = $('<div/>');
		if (test.$dataTest)
			$el.text( jb_tostring( jb_run(jb_ctx(ctx,{profile: test.$dataTest }),{type: 'data'})));
		else if (test.page)
			jb_renderControl(jb_run(jb_ctx(ctx,{profile: test.page })),$el[0]);

		return jb_control(context, {
			style: {
				html: $el[0]
			}
		});

	}
});


function jb_studio_runTest(widget, test) {
	var deferred = $.Deferred();
	try {
		var context = jb_ctx();

		for (var compName in widget.components || {})
			jb_component(compName, widget.components[compName]);

		// global resources
		for (var resourceName in widget.resources || {})
			context.resources[resourceName] = widget.resources[resourceName];

		var passed = false;
		passed = jb_run(jb_ctx(context, {
			profile: test
		}));

		if (passed && passed.promise) $.when(passed).then(function(_passed) {
			deferred.resolve(_passed);
		}, function() {
			deferred.resolve(false);
		});
		else return deferred.resolve(passed).promise();

	} catch (e) {
		jb_logException(e, 'when running test');
		return deferred.reject().promise();
	}

	return deferred.promise();
}

function jb_studio_renderAllTests() {
	var ctx = jb_ctx();
	ctx.vars.widgets = jbart_widgets;
	ctx.profile = {
		$: 'studio.allTests'
	};

	var control = jb_run(ctx);
	jb_renderControl(control, $('#jbart-studio-tests')[0]);
}

function jbstudio_tests() {
	try {
		jb_init();
		jb_initJbartObject();
		
		jbart.logs = jbart.logs || {};
		jbart.logs.error = jbart.logs.error || [];

		jb_bind(jbart.logs,'add',function(args) {
			if (args.type == 'error')
				console.error(args.text);
		});	

		jb_studio_renderAllTests();
	} catch(e) {
		jb_logException(e,'error running jbstudio_start');
	}
}
