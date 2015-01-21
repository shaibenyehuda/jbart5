jb_component('itemlist',{
	type: "control",
	params: {
		title: {},
		items: { jstype: 'array' }, 
		itemVariable: { jstype: 'string'},
		style: { 
			type: "itemlist.style", 
			defaultValue: {	$: "itemlist.ul-li" } 
		},
		controls: { type: "control[]", dynamic: true },
		features: { type: "feature[]", dynamic: true }
	},
	impl: function(context,title,items,itemVariable,style,controls,features) {
		return jb_control(context,{
			items: items,
			itemVariable: itemVariable,
			controls: controls
		});
	}
});

// style
jb_type('itemlist.style');

jb_component('itemlist.ul-li',{
	type: 'itemlist.style',
	impl: function() {
		return {
			html: '<ul class="itemlist-parent"><li class="itemlist-item"/></ul>',
			cssClass: "jb-itemlist",
			onload: function(control) {
				jb_itemlist(control);
			}
		}
	}
});

/* style function */

function jb_itemlist(itemlist) {
	itemlist.$itemParent = itemlist.$el.findIncludeSelf('.itemlist-parent');
	itemlist.$itemTemplate = itemlist.$el.findIncludeSelf('.itemlist-item');

	itemlist.$itemTemplate.remove();

	for(var i=0;i<itemlist.items.length;i++) {
		var item = itemlist.items[i];
		var $item = itemlist.$itemTemplate.clone().appendTo(itemlist.$itemParent);
		$item[0].jbItem = item;

		var controls = itemlist.controls(jb_ctx(itemlist.context,{ data: item, vars: jb_prop(itemlist.itemVariable,item) }));
		for(var j=0;j<controls.length;j++)
			jb_renderControl(controls[j],$item[0]);
  }
}

/* features */

jb_component('itemSelection',{
	type: 'feature',
	params: {
		bindSelection: { jstype: 'object'},
		itemid: { dynamic: true, jstype: 'string'},
		onSelection: { type: 'action', dynamic: true }
	},
	shortcut: { name: 'itemSelection' },
	impl: function(context,bindSelection,itemid,onSelection) {
		var itemlist = context.vars.$control;

		jb_bind(itemlist,'render',function() {
			var elems = itemlist.$itemParent.children();

			var elemToSelect = findElemOfItem(defaultSelected()) || elems[0];

			select(elemToSelect);

			elems.click(function() { select(this); });
		});

		jb_bind(itemlist,'selection',function (args) {
			var ctx = jb_ctx(context,{ data: args.item, vars: { selectionArgs: args } });
			ctx.vars[itemlist.itemVariable] = args.item;
			if (bindSelection)
				jb_writeValue(bindSelection,itemid(ctx),true);
			onSelection(ctx);
		});

		function defaultSelected() {
			var selectedID = jb_tostring(bindSelection);
			if (!selectedID) return null;

			var ctx = jb_ctx(context,{});

			for(var i=0;i<itemlist.items.length;i++) {
				ctx.data = ctx.vars[itemlist.itemVariable] = itemlist.items[i];
				if (itemid(ctx) == selectedID)
					return itemlist.items[i];
			}
		}

		function select(elem) {
			if (elem && $(elem).hasClass('selected')) return;
			var prevSelected = itemlist.$itemParent.children().filter('.selected');
			var elems = itemlist.$itemParent.children().removeClass('selected');
			if (elem && elem.jbItem) {
				$(elem).addClass('selected');
				jb_trigger(itemlist,'selection',{ item: elem.jbItem, elem: elem, prevElem: prevSelected[0] });
			}
		}

		function findElemOfItem(item) {
			if (!item) return null;
			var elems = itemlist.$itemParent.children();
			for(var i=0;i<elems.length;i++)
				if (elems[i].jbItem == item) return elems[i];
		}
	}
});
