// This variable is a reference to the most recently in focus browser window
var win;

function setView(/* optional */ urlSpec)
{
  //  var myArray = window.opener.get_full_rating(url);
  var pID = win.document.getElementById("persona_menu").value;
  pID = pID.split(':').join("");
  var url = urlSpec ? urlSpec : win.document.getElementById("urlbar").value;
  // Confirm that the url is okay.
  var myArray;
  if (url.search(/^http:\/\//) >=0 || url.search(/^https:\/\//) >=0) 
    myArray = win.NTSharedState.SNDB.lookupFullRatingData(pID, url);
  else {
    url = "<Unsupported-URI>";
    myArray = null;
  }

  // Could possibly violate the invariant that user has visited 
  // url prior to having a comment window if persona is loaded
  // with an open tab. Thus, we must check for this condition.
  //  var persona_id = window.opener.document.getElementById("persona_menu").value;
  //  var hasVisited =  myArray.length == 0 ? false : myArray[0][0] == persona_id.split(':').join("");
  var srcPID = myArray ? myArray[0][0] : pID;
  var apply = document.getElementById('apply');
  if (srcPID == "") {
    apply.setAttribute("label", "No Current Persona");
    apply.setAttribute("disabled", true);
  }
  else {
    apply.setAttribute("label", "Apply to " + win.id_to_name(srcPID));
    apply.setAttribute("disabled", false);
  }
  var ctext = document.getElementById('ctext');
  ctext.value = myArray ? myArray[0][1] : "";
  var treeView = {
  rowCount : 10000,
  getCellText : function(row,column){
      switch(column.id) {
      case "namecol":
      return win.id_to_name(myArray[row][0]);
      case 'ratecol':
      return myArray[row][2];
      case 'comcol':
      return myArray[row][1];
      }
    },
  setTree: function(treebox){ this.treebox = treebox; },
  isContainer: function(row){ return false; },
  isSeparator: function(row){ return false; },
  isSorted: function(row){ return false; },
  getLevel: function(row){ return 0; },
  getImageSrc: function(row,col){ return null; },
  getRowProperties: function(row,props){},
  getCellProperties: function(row,col,props){},
  getColumnProperties: function(colid,col,props){}
  }
  treeView.rowCount=myArray ? myArray.length : 0;
  //alert(url_box.value); 
  document.title="Comments for \""+ window.opener.NTSharedState.SNDB.SNDBs[0].DBs[0].trimURL(url) + "\"";
  //  document.title="Comments for "+url;
  document.getElementById('comments-tree').view=treeView;
}

function apply_update(){
//   if (!hasVisited())
//     window.opener.insert_visit(url);
  var pID = win.document.getElementById("persona_menu").value;
  pID = pID.split(':').join("");
  var url = win.document.getElementById("urlbar").value;
  var text = document.getElementById('ctext').value;
  var myArray = win.NTSharedState.SNDB.lookupFullRatingData(pID, url);

  var srcPID = myArray ? myArray[0][0] : pID;
  if (!myArray)
    win.NTSharedState.SNDB.updateWithVisit(srcPID,url);
  
  win.NTSharedState.SNDB.updateWithComment(srcPID,url,text);

  var selGroup = document.getElementById('rScale');
  var sel = selGroup.selectedItem;
  if (sel != null) {
    var rate = sel.label;
    // alert("window.opener.insert_rating(" + url +", "+rate +")");
    //    window.opener.insert_rating(url,rate);
    win.NTSharedState.SNDB.updateWithXPRate(srcPID,url,rate);
    selGroup.selectedIndex = -1;
  }

  // need to refresh comment view 
  //  setView(); // this is done by do_process() I think.
  // and ntoverlay view
  //  window.opener.do_process(window.opener.document.getElementById('urlbar').value);
  win.do_process(url);

}

