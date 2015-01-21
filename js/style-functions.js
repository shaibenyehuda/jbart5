function jb_uiText(uiText) {
  uiText.$el.html(uiText.text.replace(/\n/g,'<br/>'));
}

function jb_group(group) {
  var $parent = group.$el.findIncludeSelf('.parent');
  if (!$parent[0]) $parent = group.$el;

  var controls = group.controls(); 
  for(var i=0;i<controls.length;i++)
    jb_renderControl(controls[i],$parent[0]);  
}

function jb_textbox(textbox) {
  var $input = textbox.$el.findIncludeSelf('input,textarea');

  $input.val(jb_tostring(textbox.databind));

  $input.on('input',function() {
    this.jbUpdated();
  });

  $input[0].jbUpdated = function() {
    var prevValue = jb_tostring(textbox.databind);
    var newval = $input.val();
    if (newval != prevValue) {
      jb_writeValue(textbox.databind,newval);
      jb_trigger(textbox,'update',{ prevValue: prevValue });
    }
  }
}


function jb_propertySheet(propSheet,settings) {
  settings = $.extend({
    addColon: true
  },settings);

  var $property = propSheet.$el.findIncludeSelf('.property');

  for(var i=0;i<propSheet.controls.length;i++) {
    var control = propSheet.controls[i];

    var $elem = $property.clone().insertBefore($property);
    var $propertyTitle = $elem.findIncludeSelf('.property-title');
    var $propertyContent = $elem.findIncludeSelf('.property-content');

    $propertyTitle.text(control.title + (settings.addColon ? ':' : ''));
    jb_renderControl(control,$propertyContent[0]);  
  }
  $property.remove();
}

function jb_image(image) {
  if (image.width) image.$el.width(image.width);
  if (image.height) image.$el.height(image.height);

  if (image.databind) {
    var $img = $('<img/>').appendTo(image.$el).attr('src',image.databind);
  }

}

function jb_button(button) {
  button.$el.text(button.text);
  button.$el.click(function() { button.action(); })
}