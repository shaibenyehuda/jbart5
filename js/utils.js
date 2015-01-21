function jb_initJbartObject() {
  jbart.classes = jbart.classes || {};
}

function jb_component(compName,component) {
  jbart.comps[compName] = component;
  if (component.shortcut)
    jb_path(jbart,['shortcuts',component.type,component.shortcut.name],{ component:compName, mainParam: component.shortcut.mainParam });
}

function jb_type(typeName,typeObj) {
  jb_path(jbart,['types',typeName],typeObj || {});
}

function jb_function(funcName, func) {
  jb_path(jbart,['functions',funcName],func);
}

function jb_resource(widgetName,name,resource) {
  jb_path(jbart_widgets,[widgetName,'resources',name],resource);
}

function jb_tests(widgetName,tests) {
  jbart_widgets[widgetName] = jbart_widgets[widgetName] || {};
  jbart_widgets[widgetName].tests = $.extend(jbart_widgets[widgetName].tests || {},tests);
}

function jb_ctx(context,ctx2) {
  if (!context) 
    return { vars: {}, params: {}, resources: {} };  // jb_ctx() means create new context

  return {
    profile: (typeof(ctx2.profile) != 'undefined') ?  ctx2.profile : context.profile,
    data: (typeof ctx2.data != 'undefined') ? ctx2.data : context.data,     // allowing setting data:null
    vars: ctx2.vars ? jb_extend({},context.vars,ctx2.vars) : context.vars,
    params: ctx2.params || context.params,
    resources: context.resources
  }
}

// end: context creation functions

function jb_profileHasValue(context,paramName) {
  return typeof context.profile[paramName] != 'undefined';
}

function jb_logError(errorStr) {
  jbart.logs = jbart.logs || {};
  jbart.logs.error = jbart.logs.error || [];
  jbart.logs.error.push(errorStr);
  jb_trigger(jbart.logs,'add',{ type: 'error', text: errorStr });
}

function jb_logException(e,errorStr) {
  jb_logError('exception: ' + errorStr + "\n" + (e.stack||''));
}

// js type handling functions
function jb_isArray(obj) {
  if (typeof Array.isArray === 'undefined') {
    Array.isArray = function(obj) {
      return Object.prototype.toString.call(obj) === '[object Array]';
    }
  }
  return Array.isArray(obj);
}

// functions

function jb_extend(obj,obj1,obj2,obj3) {
  if (!obj) return;
  // similar to jQuery.extend but much faster for simple cases
  for(var i in obj1) obj[i] = obj1[i];
  if (obj2) for(var i in obj2) obj[i] = obj2[i];
  if (obj3) for(var i in obj3) obj[i] = obj3[i];

  return obj;
}
function jb_each(array,func) {
  for(var i=0;i<array.length;i++)
    func(array[i],i);
}
function jb_map(array,func) {
  var res = [];
  for(var i in array) {
    var item = func(array[i],i);
    if (jb_isArray(item))
      res = res.concat(item); // to check is faster than: for(var i=0;i<item.length;i++) res.push(item[i]);
    else if (item != null)
      res.push(item);
  }
  return res;
}
function jb_path(object,path,value) {
  var cur = object;

  if (typeof value == 'undefined') {  // get
    for(var i=0;i<path.length;i++) {
      cur = cur[path[i]];
      if (cur == null || typeof cur == 'undefined') return null;
    }
    return cur;
  } else { // set
    for(var i=0;i<path.length;i++)
      if (i == path.length-1)
        cur[path[i]] = value;
      else
        cur = cur[path[i]] = cur[path[i]] || {};
    return value;
  }
}
function jb_firstProp(obj) {
  for(var i in obj) return i;
  return '';
}
function jb_prop(k,v) {
  var ret = {};
  ret[k] = v;
  return ret;
}
function jb_cleanSystemProps(obj) {
  var ret = {};
  for(var i in obj) 
    if (! i.indexOf('$jb_') == 0)
      ret[i] = obj[i];

  return ret;
}

function jb_pushItemOrArray(arr,item) {
  // adds item to arr. if item is null, it is not added. if item is an array, all of its items are added. if it's a single object, it's just added
  if (typeof item == 'undefined' || item === null) return;
  if (!jb_isArray(item)) return arr.push(item);
  for(var i=0;i<item.length;i++)
    arr.push(item[i]);
}


function jb_bind(object,eventType,handler,identifier,elementForAutoUnbind,addAsFirstListener) {
  if (!object) return;
  object.$jbListeners = object.$jbListeners || {};
  object.$jbListeners.counter = object.$jbListeners.counter || 0;
  var listenerID = ++object.$jbListeners.counter;

  var listeners = object.$jbListeners[eventType] = object.$jbListeners[eventType] || [];

  for(var i=0;i<listeners.length;i++) {
    if (identifier && listeners[i].eventType == eventType && listeners[i].identifier == identifier) {
      listeners[i].handler = handler;
      return;
    }
  }
  var item = {eventType: eventType, handler: handler, identifier: identifier, listenerID: listenerID };
  if (addAsFirstListener)
    listeners.unshift(item);
  else
    listeners.push(item); 

  if (elementForAutoUnbind) {
    jb_onElementDetach(elementForAutoUnbind,function() { 
      jb_unbind(object,listenerID);
    });
  }

  return listenerID;
}

function jb_unbind(object,listenerID) {
  if (!object || !object.$jbListeners) return;

  for(var i in object.$jbListeners) {
    var listeners = object.$jbListeners[i];
    if (!listeners.length) continue;

    for(var j=0;j<listeners.length;j++) {
      if (listeners[j].listenerID == listenerID) {
        listeners.splice(j,1);
        return;
      }
    } 
  }
}

function jb_trigger(object,eventType,eventObject) {
  if (!object || !object.$jbListeners || !object.$jbListeners[eventType]) return;
  eventObject = eventObject || {};
  eventObject.eventType = eventType;
  
  var listeners = object.$jbListeners[eventType];
  for(var i=0;i<listeners.length;i++) {
    try {
      listeners[i].handler.apply(object,[eventObject]);
    } catch(e) {
      jb_logException(e,'error trigerring event ' + eventType);
    }
  } 
}

function jb_cloneData(data) {
  if (!data) return null;
  if (data.nodeType) return $(data).clone(true)[0];

  try {
    return JSON.parse(JSON.stringify(data));
  } catch(e) {
    jb_logException(e,'error cloning data object');
  }
}

function jb_observe(databind,DOMElem,callback) {
  if (!databind) return;
  var propertyName = (databind.$jb_property || databind.propertyName() || '').replace(/ ,/g,'');
  $(DOMElem).addClass('jbobserve-'+propertyName);

  DOMElem.jbObserve = { databind: databind, callback: callback };
}

function jb_fireObjectChanged(databind,changeType) {
  if (!databind || typeof GLOBAL != 'undefined') return;
  var propertyName = (databind.$jb_property || '').replace(/ ,/g,'');
  var cls = 'jbobserve-'+propertyName;

  var elems = $('.'+cls);
  for(var i=0;i<elems.length;i++) {
    var elemData = elems[i].jbObserve.databind;
    var equals = (elemData == databind);
    if (!equals && elemData.$jb_parent) equals = ( elemData.$jb_parent == databind.$jb_parent && elemData.$jb_property == databind.$jb_property);
    if (!equals && elemData.$jb_equals) equals = elemData.$jb_equals(databind);

    if (equals) {
      try {
        elems[i].jbObserve.callback(changeType);
      } catch(e) {
        jb_logException(e,'error firing object changed callback');
      }
    }
  }
}