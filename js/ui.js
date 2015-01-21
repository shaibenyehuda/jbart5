function jb_control(context,moreProperties) {
  var control = {
    context: context,
    title: context.params.title || '',
    style: context.params.style
  };
  $.extend(control,moreProperties);

  var ctx = jb_ctx(context,{ vars: {$control: control} });
  context.params.features && context.params.features(ctx);  // let the features enrich the control

  return control;
}

function jb_renderControl(control,placeholder,overridePlaceholder) {    // overridePlaceholder is used in refresh control
  if (control.prepare && !control.prepareDone) {
    jb_renderControl(control.loadingControl,placeholder,overridePlaceholder);
    $.when(control.prepare()).then(function() {
       control.prepareDone = true;
       jb_renderControl(control,control.loadingControl.$el[0],true);
    });
    return;

  }
  if (!control.style) return;
  var style = control.style;

  if (typeof style == 'string') {
    var defaultStyle = jb_run(jb_ctx(control.context,{profile: jbart.comps[control.context.profile.$].params.style.defaultValue }));
    style = jb_extend({},defaultStyle,{ cssClass: style});  // just overriding css class name
  }

  if (style.html) {
    var content = $(style.html).addClass(style.cssClass)[0];
    if (content) {
      content.jbControl = control;
      if (!overridePlaceholder)
        placeholder.appendChild(content);
      else
        placeholder.parentNode.replaceChild(content,placeholder);
    }
    control.el = content;
    control.$el = $(content);        
  }

  try {
    if (style.onload)
      style.onload(control);
  } catch(e) {
    jb_logException(e,'exception when running js of style');
  }
  if (control.id)
    control.$el.addClass('id-'+jb_fixid(control.id));

  jb_trigger(control,'render');
}

function jb_removeElement(elem) {
  $(elem).remove(); // to clean memory leaks
  if ($.browser.msie) jb_IE_cleanMemoryLeaks(elem);
}

function jb_IE_cleanMemoryLeaks(elem) {
  // TODO: remove all jb... properties from DOM ELEMENTS, + set .innerHTML to ''
}

function jb_firstElement(elem) {
  for(var iter=elem.firstChild;iter;iter=iter.nextSibling)
    if (iter.nodeType == 1) return iter;
}

function jb_findClass(objectOrElem,cls) {
  return $(objectOrElem.el || objectOrElem).findIncludeSelf('.'+cls).first();
}

function jb_fixid(id) {
  return id.replace(/\s+/g,'-');
}
function jb_onElementDetach(elem,callback) {
  // TODO: implement
}

function jb_refreshControl(control,baseElem) {
  var elem;
  if (typeof control == 'string') {
    var controlID = control;
    if (controlID.indexOf(',') > -1)
      return jb_each(controlID.split(','),function(item) { jb_refreshControl(item,baseElem); });

    elem = jb_findControlElement(baseElem,controlID);
  } else if (control.nodeType) elem = control; // the html element
  else if (control.$el) elem = control.$el[0];  // control object

  if (!elem || !elem.jbControl) return; // control not found
  var newControl = jb_tojstype(jb_run(elem.jbControl.context),'object');
  if (newControl)
   jb_renderControl(newControl,elem,true);
}

function jb_findControlElement(baseElem,controlID) {
  // find the closest control element
  var cls = 'id-'+jb_fixid(controlID);
  var found = searchChildren(baseElem);
  if (found) return found;

  // now go up and look parents/cousins
  var prevIter = baseElem;
  for(var iter=baseElem.parentNode;iter;iter=iter.parentNode) {
    if (isSearchedElement(iter)) return iter;
    var found = searchSiblings(prevIter);
    if (found) return found;

    prevIter = iter;
  }

  function isSearchedElement(elem) {
    return $(elem).hasClass(cls) && elem.jbControl.id == controlID;
  }

  function searchChildren(elem) {
    if (isSearchedElement(elem)) return elem;
    var controls = $(baseElem).find('.'+cls);
    if (controls[0]) return controls[0];
  }

  function searchSiblings(elem) {
    var parent = elem.parentNode;
    for(var iter=parent.firstChild;iter;iter=iter.nextSibling) {
      if (iter != elem) {
        var found = searchChildren(iter);
        if (found) return found;
      }
    }
  }
}

function jb_urlParam(param) {
  var out = (RegExp(param + '=' + '(.+?)(&|$)').exec(location.search) || [, null])[1];
  return (out && decodeURIComponent(out)) || '';
}

function jb_urlHashParam(param,value) {
  jb_listenToUrlChange();

  var regex = RegExp(param + '=' + '(.+?)(&|$)');

  if (typeof value == 'undefined') { 
    var out = (regex.exec(location.hash.replace(/([^[#]*)\?/,'?$path=$1&')) || [, null])[1]; // convert path to $path parameter. E.g., #doc1?a=b becomes #?$path=doc1&a=b
    return (out && decodeURIComponent(out)) || '';
  }

  if (param === '$path') {
    location.hash = location.hash.replace(/([^[#]*)\?/,value + '?');
    return;
  }

  var h = location.hash; 
  var sep = (h.indexOf('?') != -1) ? '&' : '?';
  if (!h.match(regex)) // new param - add it to the end
    location.hash = h + sep + param + '=' + value;
  else     // replace existing param
    location.hash = h.replace(regex,function(x) { return param + '=' + value + (x.indexOf('&') != -1 ? '&' : '') });
}

function jb_compareUrls(newUrl,oldUrl) {
  var res = [];
  var params = {};
  jb_each(oldUrl.split('?').pop().split('&'),function(param){
    var parts = param.split('=');
    params[parts[0]] = parts[1];
  })
  jb_each(newUrl.split('?').pop().split('&'),function(param){
    var parts = param.split('=');
    if (!params[parts[0]] || params[parts[0]] != parts[1])
      res.push(jb_run({profile: { $urlHashParam: parts[0]} }));
  });
  if ( (/([^[#]*)\?/.exec(newUrl) || [, null])[1] != (/([^[#]*)\?/.exec(oldUrl) || [, null])[1] ) // compare paths
    res.push(jb_run({profile: { $urlHashParam: '$path'} }));
  return res;
}

function jb_listenToUrlChange() {
  if (jbart.listeningToUrlChange) return;
  jbart.listeningToUrlChange = true;
  $(window).bind('hashchange', function(e) {
    e = e.originalEvent;
    jb_each(jb_compareUrls(e.oldURL.split('#').pop(), e.newURL.split('#').pop()),function(param) { 
      jb_fireObjectChanged(param);
    });
  });

}
