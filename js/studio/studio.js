jb_component("studio.all", {
	type: 'control',
	impl: {
		$: 'group',
		style: 'studio-top-bar',
		controls: [
		  { $: 'group', style: 'studio-top-menu',
		    controls: [
			  { $: 'label', 
			    databind: [ { $urlParam: 'widget' } , { $: 'replace', find: '_', replace: ' ' }],
			    style: 'studio-widget-name'
			  }
		    ]
		  },
		  { $: 'group', style: 'studio-toolbar',
		    controls: [
				  { $: 'button', text: 'page source',
				    style: { $: 'studio_button.toolbarButton', spritePosition: '3,0' },
				  	action: { $: 'studio.editPageSource'}
				  }
		    ]
		  },
		  { $: 'group', style: 'studio-jbart-logo',
		    controls: [ { $: 'image', databind: 'img/studio/favicon_localhost.png' }]
		  },
		  { $: 'group', style: 'studio-widget-placeholder',
				autoRefresh: { databind: { $urlHashParam: 'studioPage'} },
		    controls: [ { $: 'studio.renderWidget'} ]
		  },
		  { $: 'group', style: 'studio-footer',
		    controls: [ 
		      { $: 'itemlist', items: { $: 'studio.widgetPageNames'}, style: 'studio-pages', itemVariable: 'studioPage',
		      	itemSelection: {
		      		bindSelection: { $urlHashParam: 'studioPage' },
		      		itemid: '{{.}}'
		      	},
		        controls: [{ $: 'label', style: 'studio-page', databind: { $: 'extractSuffix', separator: '.' } } ]
		      }
		    ]
		  }
		]
	}
});


jb_component('studio.widgetPageNames',{
	type: 'data',
	impl: function(context) {
		var widgetName = jb_urlParam('widget');
		var out = [];
		for(var i in jbart.comps)
			if (i.indexOf(widgetName+'.') == 0 && jbart.comps[i].type == 'control')
				out.push(i);

		return out;
	}
});

function jbstudio_start() {
	try {
		jb_init();
		jbart.logs = jbart.logs || {};

		jb_bind(jbart.logs,'add',function(args) {
			if (args.type == 'error')
				console.error(args.text);
		});	

		jbstudio_renderAll();

	} catch(e) {
		jb_logException(e,'error running jbstudio_start');
	}
	
}

function jbstudio_renderAll() {
	var ctx = jb_ctx();
	ctx.profile = {$: 'studio.all'};

	jb_renderControl(jb_run(ctx), $('#jbart-studio-top')[0]);
}

jb_component('studio.renderWidget',{
	type: 'control',
	impl: function(context) {
		var $wrapper = $('<div/>').addClass('inner');
		var control = jb_control(context,{ 
			style: {
				html: $wrapper
			}
		});
		jb_bind(control,'render',function() {
			doRenderWidget(control.$el);
		})
		return control;

		function doRenderWidget($outer_wrapper) {
			var widgetName = jb_urlParam('widget');

			var iframe = $('<iframe frameborder="0" />').appendTo($outer_wrapper);
			iframe[0].contentWindow.document.open();
			iframe[0].contentWindow.document.write('<html><head/><body style="background: #fff; margin:0;"><div id="jbart-placeholder"></div></body></html>');
			iframe[0].contentWindow.document.close();

			for(var i in window)
				if (i.indexOf('jb') == 0)
					iframe[0].contentWindow[i] = window[i];

			iframe[0].contentWindow.jbartWidget = window.jbart_widgets[widgetName];

			jb_initJbartObject();
			var widget = iframe[0].contentWindow.jbartWidget;

			var context = jb_ctx();
			var wrapper = $(iframe[0].contentWindow.document).find('#jbart-placeholder')[0];

			// global resources
			for (var resourceName in widget.resources || {}) 
				context.resources[resourceName] = widget.resources[resourceName];

			// load script (define components)
			for(var compName in widget.components || {}) {
				jb_component(compName,widget.components[compName]);
			}

			var pageToShow = jb_urlHashParam('studioPage') || widgetName+'.main';
			var mainComponent = jbart.comps[pageToShow];

			// execute the main page
			if (mainComponent) {
				var control = jb_run(jb_ctx(context,{ profile: mainComponent.impl }));
				jb_renderControl(control,wrapper);
			} else {
				$(wrapper).text('no component by the name ' + pageToShow);
			}
		}
	}
})

