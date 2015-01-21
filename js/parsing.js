jb_component('extract',{
	type: 'data',
	params: {
		startMarkers: { type: "data[]", jstype: 'array', description: "defines the beginning of the extracted area"},
		endMarker: { jstype: 'string', description: "defines the end of the extracted area"},
		from : { defaultValue: '{{}}', jstype: 'string'},
		regex: { type: 'boolean', jstype: 'boolean' },
		keepStartMarker: { type: 'boolean', jstype: 'boolean' },
		keepEndMarker: { type: 'boolean', jstype: 'boolean' },
		trim: { type: 'boolean', jstype: 'boolean', description: 'Trim white spaces from the result' },
		onlyFirstResult: { type: 'boolean', jstype: 'boolean' }
	},
	impl: function(context,startMarkers,endMarker,from,regex,keepStartMarker,keepEndMarker,trim,onlyFirstResult) {
		var startMarkers = jb_map(startMarkers,function(m) { return jb_tostring(m); });

	  if (onlyFirstResult) {
		 	var text = extractOne(from).text;
		 	return trim ? text.trim() : text;
		 }
	   // extracting multiple results
		 var remaining = from,result=[];
		 while (remaining) {
		 	var res = extractOne(remaining);
		 	if (!res || res.scanned == 0) return result;
		 	remaining = remaining.substring(res.scanned);
		 	result.push(trim ? res.text.trim() : res.text);
		 }
		 return result;

		function markerPosition(str, marker) { 
			if (!regex)
				return { pos: str.indexOf(marker), length: marker.length };

  		var match = str.match(new RegExp(marker,'m'));
  		return match && { pos: match.index, length: match[0].length};
	  }

		function extractOne(text) {
			var scanned = 0;
			for(var i=0;i<startMarkers.length;i++) {
				var marker = markerPosition(text,startMarkers[i]);
				if (!marker || marker.pos == -1) return;
				scanned += marker.pos + marker.length;
				if (i == startMarkers.length -1 && keepStartMarker)
					text = text.substring(marker.pos);
				else
					text = text.substring(marker.pos+marker.length);
			}

			if (!endMarker) return { text: text, scanned: scanned + text.length }

			var marker = markerPosition(text,endMarker);
			if (!marker || marker.pos == -1) return;

			scanned += marker.pos + marker.length;
			if (marker.pos == -1) return;
			if (keepEndMarker)
					text = text.substring(0,marker.pos+marker.length);
			else
					text = text.substring(0,marker.pos);

			return { text: text, scanned : scanned }
	 }
	}
});

jb_component('match',{
	type: 'data,boolean',
	params: {
		regex: { jstype: 'string', description: '/w- alphnumberic, /s- whitespace, ^- beginline, $-endline'},
		text : { jstype: 'string', defaultValue: '{{}}'},
		flags: { jstype: 'string', description: "g - find all matches, m - multiline, i - ignore case"},
		group: { jstype: 'number', description: "index of group to match, null returns an array of all parts"},
		returnAllForNoMatch: { type: 'boolean', jstype: 'boolean' },
		matchWholeText: { type: 'boolean', jstype: 'boolean' }
	},
	impl: function(context,	regex,text,flags,group,returnAllForNoMatch,matchWholeText) {
		if (matchWholeText)	
			regex = '^' + regex + '$';
		var match = text.match(new RegExp(regex,flags));
		if (!match && returnAllForNoMatch) return text;
		if (match && group) return match[group];
		return match;
	}
});

jb_component('extractWithRegex',{
	type: 'data',
	params: {
		regex: { jstype: 'string', description: '/w- alphnumberic, /s- whitespace, ^- beginline, $-endline'},
		text : { jstype: 'string', defaultValue: '{{}}'},
		flags: { jstype: 'string', defaultValue: 'mg', description: "g - find all matches, m - multiline, i - ignore case"},
		prefix: { type: 'boolean', jstype: 'boolean' },
		suffix: { type: 'boolean', jstype: 'boolean' },
		onlyFirstResult: { type: 'boolean', jstype: 'boolean' }
	},
	impl: function(context,regex,text,flags,prefix,suffix,onlyFirstResult) {
		if (!regex) return;
		if (onlyFirstResult) flags = flags.replace(/g/,'');
		if (prefix && regex[0] != '^') regex = '^' + regex;
		if (suffix && regex.slice(-1) != '$') regex += '$';
		var match = text.match(new RegExp(regex,flags));
		return match;
	}
});

jb_component('replace',{
	type: 'data',
	params: {
		text: { jstype: 'string', defaultValue: '{{.}}' },
		find: { jstype: 'string' },
		replace: { jstype: 'string' },
		useRegex: { type: 'boolean', jstype: 'boolean'},
		regexFlags: { jstype: 'string', defaultValue: 'g', description: 'g,i,m' }
	},
	impl: function(context,text,find,replace,useRegex,regexFlags) {
		if (useRegex) {
			return text.replace(new RegExp(find,regexFlags) ,replace);
		} else
			return text.replace(find,replace);
	}
});

jb_component('extractPrefix',{
	type: 'data',
	params: {
		separator: { jstype: 'string', description: '/w- alphnumberic, /s- whitespace, ^- beginline, $-endline'},
		text : { jstype: 'string', defaultValue: '{{}}'},
		regex: { type: 'boolean', jstype: 'boolean', description: 'separator is regex' },
		keepSeparator: { type: 'boolean', jstype: 'boolean' },
	},
	impl: function(context,separator,text,regex,keepSeparator) {
		if (!regex) {
			return text.substring(0,text.indexOf(separator)) + (keepSeparator ? separator : '');
		} else { // regex
			var match = text.match(separator);
			if (match)
				return text.substring(0,match.index) + (keepSeparator ? match[0] : '');
		}
	}
});

jb_component('extractSuffix',{
	type: 'data',
	params: {
		separator: { jstype: 'string', description: '/w- alphnumberic, /s- whitespace, ^- beginline, $-endline'},
		text : { jstype: 'string', defaultValue: '{{}}'},
		regex: { type: 'boolean', jstype: 'boolean', description: 'separator is regex' },
		keepSeparator: { type: 'boolean', jstype: 'boolean' },
	},
	impl: function(context,separator,text,regex,keepSeparator) {
		if (!regex) {
			return text.substring(text.lastIndexOf(separator) + (keepSeparator ? 0 : separator.length));
		} else { // regex
			var match = text.match(separator+'(?![\\s\\S]*' + separator +')'); // (?!) means not after, [\\s\\S]* means any char including new lines
			if (match)
				return text.substring(match.index + (keepSeparator ? 0 : match[0].length));
		}
	}
});

jb_component('split',{
	type: 'data',
	params: {
		separator: { jstype: 'string' },
		text : { jstype: 'string', defaultValue: '{{}}'}
	},
	impl: function(context,separator,text) {
		return text.split(separator);
	}
});
