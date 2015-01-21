/*********** button ******************/

jb_component('studio_button.toolbarButton',{
	type: 'button.style',
	params: {
		spritePosition: { jstype: 'string', defaultValue: '0,0' }
	},
	impl: function(context,spritePosition) {
		return {
			html: '<div><div class="inner"/></div>',
			cssClass: "studio-btn-toolbar",
			onload: function(button) {
				var pos = jb_map(spritePosition.split(','),function(item) {
					return (-parseInt(item)*16) + 'px';
				}).join(' ');
				button.$el.find('.inner').css('background-position',pos);
				button.$el.attr('title',button.text).click(button.action);
			}
		}
	}
});

