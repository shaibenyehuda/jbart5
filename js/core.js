function jb_run(context,parentParam) {
  try {
    var profile = context.profile;
    var profile_jstype = typeof profile;
    var parentParam_type = parentParam && parentParam.type;
    var jstype = parentParam && parentParam.jstype;
    if (profile_jstype === 'string' && parentParam_type === 'boolean') return jb_bool_expression(profile, context);
    if (profile_jstype === 'boolean' || profile_jstype === 'number') return profile; // native primitives
    if (profile_jstype === 'string') return jb_tojstype(jb_expression(profile, context),jstype);
    if (profile_jstype === 'function') return jb_tojstype(profile(context),jstype);

    var out;
    if (jb_isArray(profile)) {
      if (!profile.length) return jb_tojstype(null,jstype);
      if (!parentParam || !parentParam.type || parentParam.type === 'data' ) // pipeline as default for array
        out = jbart.comps.pipeline.impl(jb_ctx(context,{profile: { items : profile }}));
      if (parentParam_type === 'action' || parentParam_type === 'action[]')
        jb_map(profile,function(inner) { jb_run(jb_ctx(context,{profile: inner})) });
    } else if (profile.$if) {
        var newProfile = { $: (parentParam.type || 'data')+'.if', condition: profile.$if, then: profile.then,"else": profile["else"] };        
        out = jb_run(jb_ctx(context,{profile: newProfile}));
    } else {
      if (profile.$debugger) debugger;
      var comp_name = profile.$ || (jb_firstProp(profile).indexOf('$') == 0 && jb_firstProp(profile).split('$').pop()); // $comp sugar
      
      var comp = jbart.comps[comp_name];
      if (!comp) return jb_logError('component ' + comp_name + ' is undefined');
      if (!comp.impl) return jb_logError('component ' + comp_name + ' has no implementation');

      var ctx = cloneContext(context);
      ctx.parentParam = parentParam;
      prepareVarValues(ctx,comp,profile);
      prepareParamValues(ctx,comp,profile);

      if (typeof comp.impl === 'function') {
        var args = prepareGCArgs(ctx);
        out = comp.impl.apply(null,args);
      } else
        out = jb_run(jb_ctx(ctx,{profile: comp.impl }),parentParam);

      if (profile.$log)
        console.log(jb_run( jb_ctx(context, { profile: profile.$log, data: out, vars: { data: context.data } }) ) );
    }
    return jb_tojstype(out,jstype);
  } catch (e) {
    jb_logException(e,'exception while running jb_run');
  }
}

function prepareVarValues(ctx,comp,profile) {
  for(var varname in profile.$vars || {})
    ctx.vars[varname] = jb_run(jb_ctx(ctx,{ profile: profile.$vars[varname] }));
}

// prepare param values (is done for both gc and profile in jbart script)
function prepareParamValues(ctx,comp,profile) {
  ctx.params = {};
  var first = true;

  for (var p in comp.params) {
    var param = comp.params[p];
    var val = profile[p];
    if (!val && first && jb_firstProp(profile) != '$') // $comp sugar
      val = profile[jb_firstProp(profile)]; 
    if (!param.ignore)
      ctx.params[p] = calc_param_value(param, val || param.defaultValue || []);
    first = false;
  }

  function calc_param_value(param,newProfile) {
    if (param.dynamic)
      return funcDynamicParam(ctx,newProfile,param);
    
    if (param.type && param.type.indexOf('[]') > -1 && jb_isArray(newProfile)) // array of profiles
      return jb_map(newProfile.concat(shortcuts(param,newProfile,ctx.profile)),function(prof) {
        return jb_run(jb_ctx(ctx,{profile: prof}),param);
      });
    var ctxToRun = jb_ctx(ctx,{profile: newProfile});
    return jb_run(ctxToRun,param);
  }
}

function funcDynamicParam(ctx,newProfile,param) {
  return function(ctx2) {  
    if (param && param.type && param.type.indexOf('[') != -1 && jb_isArray(newProfile)) // array
      return jb_map(newProfile.concat(shortcuts(param,newProfile,ctx.profile)),function(prof) {
        return jb_run(jb_ctx(ctx2 || ctx,{ profile: prof }),param);
      });

    var ctxToRun = jb_ctx(ctx2 || ctx,{ profile: newProfile });
    return newProfile && jb_run(ctxToRun,param);
  }
}

function shortcuts(param,profile,parentProfile) {
  var type = param.type && param.type.split('[')[0];
  if (!jbart.shortcuts || !jbart.shortcuts[type]) return [];

  return jb_map(parentProfile, function(val,prop) {
    var shortcutdef = jbart.shortcuts[type][prop];
    var profileProp = parentProfile[prop];
    if (shortcutdef) {
      var ret = { $: shortcutdef.component};
      if (shortcutdef.mainParam && (typeof profileProp != 'object' || jb_isArray(profileProp)))
        ret[shortcutdef.mainParam] = profileProp;
      else if (!shortcutdef.mainParam && typeof profileProp != 'object') // boolean
        return profileProp ? ret : null;
      else
        jb_extend(ret,profileProp);
      return ret;
    }
  });
}

function prepareGCArgs(ctx) {
  return [ctx].concat(jb_map(ctx.params, function(p) {return [p]}));
}

function cloneContext(context) {
  return { 
    profile: context.profile,
    data: context.data,
    vars: jb_extend({},context.vars),
    params: jb_extend({},context.params),
    resources: context.resources
  }
}

function jb_var(context,varname) {
  if (context.params[varname]) return context.params[varname];
  if (context.vars[varname]) return context.vars[varname];
  if (context.resources[varname]) return context.resources[varname];
}

function jb_expression(expression, context, jstype) {
  if (expression.indexOf('{{') == -1) return expression;

  if (expression.lastIndexOf('{{') == 0 && expression.indexOf('}}') == expression.length-2) // just one expression filling all string
    return jb_evalExpressionPart(expression.substring(2,expression.length-2),context,jstype);

  return expression.replace(/{{(.*?)}}/g, function(match,contents) {
    return jb_tostring(jb_evalExpressionPart(contents,context,jstype));
  });
}

function jb_evalExpressionPart(expressionPart,context,jstype) { 
  // example: {{$person.name}}.     
  if (expressionPart == ".") expressionPart = "";

  // empty primitive expression
  if (!expressionPart && (jstype == 'string' || jstype == 'boolean' || jstype == 'number')) 
    return jbart.jstypes[jstype](context.data);

  if (expressionPart.indexOf('=') == 0) { // function
    var parsed = expressionPart.match(/=([a-zA-Z]*)\((.*)\)/);
    var funcName = parsed && parsed[1];
    if (funcName && jbart.functions[funcName])
      return jb_tojstype(jbart.functions[funcName](context,parsed[2]),jstype);
  }

  var parts = expressionPart.split('.');
  var item = context.data;

  for(var i=0;i<parts.length;i++) {
    var part = parts[i];
    if (part == '') continue;
    if (part == '$parent' && item.$jb_parent && i > 0) 
      item = item.$jb_parent;
    else if (part.charAt(0) == '$' && i == 0)
      item = jb_var(context,part.substr(1));
    else if (jb_isArray(item))
      item = jb_map(item,function(inner) {
        return typeof inner === "object" ? jb_objectProperty(inner,part,jstype) : inner;
      });
    else if (typeof item === 'object')
      item = item && jb_objectProperty(item,part,jstype);

    if (!item) return;
  }
  return item;
}

function jb_bool_expression(expression, context) {
  if (expression.indexOf('!') == 0)
    return !jb_bool_expression(expression.substring(1), context);
  var parts = expression.match(/(.+)(==|<|>|>=|<=|\^=|\$=)(.+)/);
  if (!parts)
    return !! jb_expression(expression, context, 'string');
  if (parts.length != 4)
    return jb_logError('invalid boolean expression: ' + expression);
  var op = parts[2].trim();

  if (op == '==' || op == '!=' || op == '$=' || op == '^=') {
    var p1 = jb_expression(parts[1].trim(), context, 'string');
    var p2 = jb_expression(parts[3].trim(), context, 'string');
    if (op == '==') return p1 == p2;
    if (op == '!=') return p1 != p2;
    if (op == '^=') return p1.lastIndexOf(p2,0) == 0; // more effecient
    if (op == '$=') return p1.indexOf(p2, p1.length - p2.length) !== -1;
  }

  var p1 = jb_tojstype(jb_expression(parts[1].trim(), context), 'number');
  var p2 = jb_tojstype(jb_expression(parts[3].trim(), context), 'number');

  if (op == '>') return p1 > p2;
  if (op == '<') return p1 < p2;
  if (op == '>=') return p1 >= p2;
  if (op == '<=') return p1 <= p2;
}

function jb_tojstype(value,jstype) {
  if (!jstype) return value;
  if (!jbart.jstypes) jb_initJstypes();
  return jbart.jstypes[jstype](value);
}
function jb_tostring(value) { return jb_tojstype(value,'string'); }
function jb_toarray(value) { return jb_tojstype(value,'array'); }
function jb_toboolean(value) { return jb_tojstype(value,'boolean'); }

function jb_initJstypes() {
  jbart.jstypes = {
    'string': function(value) {
      if (jb_isArray(value)) value = value[0];
      if (!value) return '';
      if (value.$jb_val) value = value.$jb_val(); // value by ref
      return '' + value;
    },
    'number': function(value) {
      if (jb_isArray(value)) value = value[0];
      if (!value) return null;
      if (value.$jb_val) value = value.$jb_val(); // value by ref
      return Number(value);
    },
    'array': function(value) {
      if (jb_isArray(value)) return value;
      if (!value) return [];
      return [value];
    },
    'boolean': function(value) {
      if ((jb_isArray(value)) && !value.length) return false;
      return value ? true : false;
    },
    'object': function(value) {
      if (jb_isArray(value)) return value[0];
      if (!value) return value;
      return value;
    }
  }
}

function jb_profileType(profile) {
  if (!profile) return '';
  if (typeof profile == 'string') return 'data';
  var comp_name = profile.$ || jb_firstProp(profile).split('$').pop();

  return (jbart.comps[comp_name] && jbart.comps[comp_name].type) || '';
}

function jb_writeValue(to,val,fireObjectChanged) {
  if (!to) return;
  if (to.$jb_val) {
    to.$jb_val(val);  // value by ref    
  }
  if (fireObjectChanged) jb_fireObjectChanged(to);
}

function jb_objectProperty(object,property,jstype) {
  if (!object) return null;

  if (property == '*') 
    return jb_map(object,function(v,prop){
      if (prop.indexOf('$jb') != 0) 
        return jb_objectProperty(object,prop);
    });

  var type = typeof object[property];

  if (jstype == 'string' || jstype == 'boolean' || jstype == 'number')
    return jbart.jstypes[jstype](object[property]); // no need for valueByRef

  if (object[property] && (type == 'object' || type == 'array')) {
    return jb_extend(object[property],{
      $jb_parent: object,
      $jb_property: property
    });
  } else { // primitive
    if (!jbart.classes.jsonValueByRef) jb_initJsonValueByRef();
    return new jbart.classes.jsonValueByRef(object,property);
  }  
}

function jb_initJsonValueByRef() {
  jbart.classes.jsonValueByRef = function(object,property) {
    this.$jb_object = object;
    this.$jb_property = property;
  }
  jbart.classes.jsonValueByRef.prototype = {
    $jb_val: function(newval) {
      if (typeof newval == 'undefined') 
        return this.$jb_object[this.$jb_property];  // get

      this.$jb_object[this.$jb_property] = newval;  // set
    }
  }
}

function jb_init() {
  if (typeof $ != 'undefined' && $.fn) 
    $.fn.findIncludeSelf = function(selector) { return this.find(selector).addBack(selector); }  
}