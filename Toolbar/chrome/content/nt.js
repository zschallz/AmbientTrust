/*
nt.js: provides the following functionality for the main component of the toolbar - get current page url, opens new windows, 
toggles between friends and network view, changes the progress bar
authors:  Alla Genkina, 2004-2005
          Camilo Viecco 2007
          Alex Tsow     2007
*/
//var historyDS = rdfService.GetDataSource("rdf:history");
var page;
var webpage;
var num;
var req;
var current_ident=null;

//var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
//                   getService(Components.interfaces.nsIRDFService);
//var current_domain="www.iub.edu";
//var disable_ui="true";


var myExt_urlBarListener = {
  QueryInterface: function(aIID)
  {
   if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
       aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
       aIID.equals(Components.interfaces.nsISupports))
     return this;
   throw Components.results.NS_NOINTERFACE;
  },

  onLocationChange: function(aProgress, aRequest, aURI)
  {
    myExtension.processNewURL(aURI);
  },

  onStateChange: function() {},
  onProgressChange: function() {},
  onStatusChange: function() {},
  onSecurityChange: function() {},
  onLinkIconAvailable: function() {}
};

var myExtension = {
  oldURL: null,
  
  init: function() {
    // Listen for webpage loads
    gBrowser.addProgressListener(myExt_urlBarListener,
        Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT);
  },
  
  uninit: function() {
    gBrowser.removeProgressListener(myExt_urlBarListener);
  },

  processNewURL: function(aURI) {
    if (aURI.spec && (aURI.spec == this.oldURL || !isTopLevel(aURI.spec))) {
      //      alert("Request Denied:\N processNewURL("+aURI.spec+")\n" +"urlbar="+ document.getElementById("urlbar").value);
      return;
    }
    //    alert("processNewURL("+aURI.spec+")\n" +"urlbar="+ document.getElementById("urlbar").value);
    this.oldURL = aURI.spec;
    do_process(""+aURI.spec);
  }
};

var isTopLevel = function (loc) {
  for (var i = 0; i < window.frames.length; i++) {
    if ( window.frames[i].location == loc )
      return true;
  }
  return false;
}


var NTEvents  = {
  init: function() {
    var appcontent = document.getElementById("appcontent");   // browser
    if(appcontent) {
    
    
    
    
      //      appcontent.addEventListener("pageshow", this.onPageLoad, false);
      appcontent.addEventListener("pagehide", this.onPageUnload, false);
      appcontent.addEventListener("focus", this.onFocus, true);
    }
   },

  onPageLoad: function(aEvent) {
    var doc = aEvent.originalTarget; // doc is document that triggered "pageshow" event
    if (aEvent.originalTarget.nodeName == "#document" && isTopLevel(doc.location)) {
 	var persona_id=document.getElementById("persona_menu").value;
 	persona_id=persona_id.split(':').join("");
 	if(persona_id.length > 0){
	  var url_val = doc.location.toString();
	  //	  insert_visit(url_val);
	  alert("pageshow handler calling do_process(" + document.getElementById("urlbar").value +")")
	  do_process(document.getElementById("urlbar").value);
	}
    }
  },

  onPageUnload: function(aEvent) {
    var doc = aEvent.originalTarget; // doc is document that triggered "pagehide" event
    var isTopLevel = function (loc) {
      for (var i = 0; i < window.frames.length; i++) {
	if ( window.frames[i].location == loc )
	  return true;
      }
      return false;
    }
    if (aEvent.originalTarget.nodeName == "#document" && isTopLevel(doc.location)) {
 	var persona_id=document.getElementById("persona_menu").value;
 	persona_id=persona_id.split(':').join("");
 	if(persona_id.length > 0){
	  var url_val = doc.location.toString();
	  //	  alert("NTSharedState.SNDB.updateWithVisit("+ persona_id +","+url_val+")");
	  NTSharedState.SNDB.updateWithVisit(persona_id,url_val);
	  //	  NTSharedState.SNDB("updateWithVisit",persona_id,url_val);
	  //	  insert_visit(url_val);
	}
    }
  },

  onFocus: function(aEvent) {
    attachToCommentsWin();
  },
  
  onClose: function () {
    //			  alert("unloading");
    var comWin;
    if (comWin = getCommentsWin()) 
      if (comWin.win == self) 
	comWin.close();

    // this assures that is the DBhost is closed, that it is copied to another open window.
    if (NTSharedState.isDBhost) {
      NTSharedState.SNDB.savePersonaDBs();
      //			    alert("This window is a DBhost");
      // then load SNDB into another window if available since closing kills scope
      var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
	.getService(Components.interfaces.nsIWindowMediator);
      var enumerator = wm.getEnumerator("navigator:browser");

      if (enumerator.hasMoreElements()) {

	// enumerator.getNext() should never be null on the first iteration since 'this' is a "navigator:browser"
	var win = enumerator.getNext();
	if (win == self) {
	  if (enumerator.hasMoreElements()) 
	    win = enumerator.getNext();	
	  else 
	    return true;
	}
	win.refreshAllWin();
	win.NTSharedState.isDBhost = true;
	//	var urlbar=win.document.getElementById("urlbar");
	//	urlbar.value = "http://informatics.indiana.edu/";
      }
    }
    return true;
  }

}


window.addEventListener("load", function() {NTEvents.init();}, false);
// register DB transfer code.
window.addEventListener("unload", NTEvents.onClose, false);


window.addEventListener("load", function() {myExtension.init()}, false);
window.addEventListener("unload", function() {myExtension.uninit()}, false);

// initialize cross-window stateful counter
window.addEventListener("load", function() {NTSharedState.init();}, false);
window.addEventListener("unload", function() {NTSharedState.fin();}, false);





var NTSharedState = {
 init: function () {
    var fileDS = rdfService.GetDataSourceBlocking("chrome://nettrust/content/data/social_net.rdf");
    var folderRes = rdfService.GetResource("http://www.nettrust-site.net/social_net");
    var netid = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
    var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
    try {
      container.Init(fileDS, folderRes);
    }
    catch (ex){alert("Failure opening social_net.rdf");}
    var i = 0;
    //var pIDs = new Array();
    var children = container.GetElements();
    if (!children.hasMoreElements()) {
      //alert("no personas");
      window.open("chrome://nettrust/content/initialize.xul", "bmarks", "chrome,resizable=no,centerscreen=yes,modal=yes,alwaysRaised=yes");
      fileDS = rdfService.GetDataSourceBlocking("chrome://nettrust/content/data/social_net.rdf");
      fileDS.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
      fileDS.Refresh(true);
      document.getElementById("persona_menu").builder.refresh();
    }  
    
    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
    var enumerator = wm.getEnumerator("navigator:browser");
    while(enumerator.hasMoreElements()) {
      var win = enumerator.getNext();

      if (self != win && win.NTSharedState && win.NTSharedState.init) {

	this.SNDB = win.NTSharedState.SNDB;
	this.count = win.NTSharedState.count;
	this.isDBhost = false;

	// set persona_menu to parallel nym
	var menu = document.getElementById("persona_menu");
	var winInd = win.document.getElementById("persona_menu").selectedIndex;
	menu.selectedIndex = winInd;

	// if a nym, show connection icon.
	if (menu.value.length > 0)
	  document.getElementById("persona_button").setAttribute("image", "chrome://nettrust/skin/connect.png");
	
	return; 
      }
    }

    var SNIDs = getSNIDs();
    this.SNDB = new MultiPersonaDB(SNIDs);
    this.isDBhost = true;
    this.count = function(x) {return function() { return ++x; };} (0);
  },

 isDBhost: null,
 SNDB: null,
 fullRate: null, // reference to the comments/full-ratings window 
 count: null,
 fin: function(){
    //    alert("Closing window");
    return;
  }
}

function try_url_warn(url){
   var decoded_url=decodeURI(url);
   var array;

   //explanation for the regexp:
   //  start with conditional  match for the protocol
   //  follow with a conditional match for username 
   //  follow with a match on the server name
   //  follow with a conditional match on the port number
   // good try: array=decoded_url.match(/^((\w+):\/\/)?(([A-Za-z0-9\.]+)@)?([A-Za-z0-9\.]+)(:(\d+))?\//);
   array=decoded_url.match(/^((\w+):\/\/)?(([^:\/]+)@)?([^:\/@]+)(:(\d+))?\//);

   //alert("decoded_rul="+decoded_url);
   //alert("array="+array.join());

   // need to assure that array at least 6 elements
   if (!array || array.length <= 5)
     return;
   //warn if server looks like an ip address and the server is not the loopback addr
   //  and is not part of the private ip address space (rfc 1918)
   var server=array[5];
   //alert("server="+server);   
   if(server.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/) && (server !="127.0.0.1") 
        && ( !(server.match(/^172.(1[6-9]|2\d|3[01]).(\d{1,3})\.(\d{1,3})$/)) ) 
        && ( !(server.match(/^192.168.(\d{1,3})\.(\d{1,3})$/)) )
        && ( !(server.match(/^10.(\d{1,3}).(\d{1,3})\.(\d{1,3})$/)) ) ){
	alert("URIs with IP addresses rather than domains are often deceptive.\nThis web site is unsafe for financial transactions.");
   }
 
   return;
}

function do_process(url_val){
	
	//ip_lookup(url_val);
  //  alert("do_process(" +url_val+")");
  try_url_warn(url_val);	

  // Checking existence of SNDB
//   var i,m; 
//   for (i=0, m="Current Personas:\n"; i<NTSharedState.SNDB.SNDBs.length; i++)
//     m += NTSharedState.SNDB.SNDBs[i].DBs[0].getID() + "\n";

//   alert(m);

  if (url_val.search(/^http:\/\//) >=0 || url_val.search(/^https:\/\//) >=0) {
    do_peer_ratings(""+url_val);
	applyBroadcasterFilter(""+url_val);
	// If comment window is open, update it, but don't bring to focus.
	//	if ( NTSharedState.fullRate && !NTSharedState.fullRate.closed ) {
	var comWin = getCommentsWin();
	if ( comWin ) {
	  //	  alert("do_process("+url_val+")\n"+"urlbar = " + document.getElementById("urlbar").value);
	  //	  alert("urlbar = " + document.getElementById("urlbar").value);
	  // this next line is a hack, but its effect seems to pull the url_val into the urlbar element
	  comWin.win=self;
	  comWin.setView(url_val);
	}
	//get_url();
  } 
  else {
    var xComLabel = document.getElementById("comments");
    xComLabel.setAttribute("label", "Comments: 0/0");
    update_gui_peers("0", "0");
    hide_broadcaster_ratings();
  }
}

//listens for the loading of a new webpage and calls a function to get the url
//document.addEventListener("load", function() { geturl(); }, true);


//gets current url from firefox's address textbox, used the DOM Inspector to get texbox ID
function geturl () {
	
	var urlbox = document.getElementById("urlbar");
	var url_val = urlbox.value;

	//applyBroadcasterFilter();
	
        if(webpage == null){
           webpage = url_val;
        }	
        if (!(webpage == url_val )){
           //a different webpage is loaded	
           //update broadcasters
           update_peer_data();
        }

	//if(webpage == null){
	//	webpage = url_val;
	//	set_ui(url_val);
	//}
	//else if(webpage != url_val) {
	//	webpage = url_val;
	//	set_ui(url_val);
	//}
}



function broadcaster_label(website_domain,node_domain){
	return node_domain;
}

function update_peer_data(){
	//alert("updating peer data!");
   if ( (current_ident == null) || (current_ident=="")){
    //disable all
    //var friends = document.getElementById("lfriends");
    //friends.setAttribute("disabled", "true"); 
     disable_peer_buttons();
     return "true"; 
   }
   //no else is needed
}

//is the ui enabled?
function disable_ui(){
   window.open("chrome://nettrust/content/login2.xul", "bmarks", "chrome,width=600,height=300");
   return "true";
}


//open window to log in
function login() {
        window.openDialog("chrome://nettrust/content/personas.xul", "bmarks", "chrome,resizable=yes,centerscreen=yes,modal=yes,alwaysRaised=yes");	
}

//open window to manage broadcasters
function open_broadcaster_win() {
    //window.open("chrome://nettrust/content/broadcaster_base.xul", "bmarks", "chrome,width=400,height=300");	
  var bWin = window.open("chrome://nettrust/content/broadcaster_base.xul", "bmarks", "chrome,width=400,height=300,resizable=yes");	
  bWin.focus();
}



//open window to read comments
function comments() {
  //	var c = "http://silo.cs.indiana.edu:13795/comments.html?nym=home";
	//window.open(c, "Read Comments", "chrome,width=400,height=275,left=362, top=184");	
	//	NTSharedState.fullRate = window.open("chrome://nettrust/content/comments2.xul", "fullRate", "chrome,width=400,height=300,left=362, top=164,resizable=yes");	
	//	NTSharedState.fullRate.focus();
	var comWin = window.open("chrome://nettrust/content/comments2.xul", "fullRate", "chrome,width=400,height=300,left=362, top=164,resizable=yes");	
	comWin.focus();
}

	
//
function update_gui_peers(positive, negative){
	
	var p_rating = positive;
	var n_rating = negative;
	
	var red1 = document.getElementById("red1");
	var red2 = document.getElementById("red2");
	var red3 = document.getElementById("red3");
	var red4 = document.getElementById("red4");
	var red5 = document.getElementById("red5");
	
	var green1 = document.getElementById("green1");
	var green2 = document.getElementById("green2");
	var green3 = document.getElementById("green3");
	var green4 = document.getElementById("green4");
	var green5 = document.getElementById("green5");
	try {
		siteAdvisorLookUp(); // kludge!
	} catch (ex) { dump( ex ); } // Just in case this code does not work as expected!
	ambientUpdate(p_rating, n_rating);
	//set positive ratings on gui
	switch(p_rating){
	
	case '0':
		green1.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		green2.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		green3.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		green4.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		green5.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
	break;
	
	case '1':
		green1.setAttribute("src","chrome://nettrust/skin/green.gif");
		green2.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		green3.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		green4.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		green5.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
	break;
	
	case '2':
		green1.setAttribute("src","chrome://nettrust/skin/green.gif");
		green2.setAttribute("src","chrome://nettrust/skin/green.gif");
		green3.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		green4.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		green5.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
	break;	
	
	case '3':
		green1.setAttribute("src","chrome://nettrust/skin/green.gif");
		green2.setAttribute("src","chrome://nettrust/skin/green.gif");
		green3.setAttribute("src","chrome://nettrust/skin/green.gif");
		green4.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		green5.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
	break;
	
	case '4':
		green1.setAttribute("src","chrome://nettrust/skin/green.gif");
		green2.setAttribute("src","chrome://nettrust/skin/green.gif");
		green3.setAttribute("src","chrome://nettrust/skin/green.gif");
		green4.setAttribute("src","chrome://nettrust/skin/green.gif");
		green5.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
	break;
	
	case '5':
		green1.setAttribute("src","chrome://nettrust/skin/green.gif");
		green2.setAttribute("src","chrome://nettrust/skin/green.gif");
		green3.setAttribute("src","chrome://nettrust/skin/green.gif");
		green4.setAttribute("src","chrome://nettrust/skin/green.gif");
		green5.setAttribute("src","chrome://nettrust/skin/green.gif");
	break;	
	
	case '10':
		alert("Warning: This website does not appear to be valid.");
	break;
	}
	
	//set negative ratings on gui
	switch(n_rating) {
	
	case '0':
		red1.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red2.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red3.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red4.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red5.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
	break;
	
	case '-1':
		
		red1.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red2.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red3.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red4.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red5.setAttribute("src","chrome://nettrust/skin/red.gif");
	break;
	
	case '-2':
	
		red1.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red2.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red3.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red4.setAttribute("src","chrome://nettrust/skin/red.gif");
		red5.setAttribute("src","chrome://nettrust/skin/red.gif");
	break;
	
	case '-3':
		red1.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red2.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red3.setAttribute("src","chrome://nettrust/skin/red.gif");
		red4.setAttribute("src","chrome://nettrust/skin/red.gif");
		red5.setAttribute("src","chrome://nettrust/skin/red.gif");
	break;
	
	case '-4':
		red1.setAttribute("src","chrome://nettrust/skin/neutral2.gif");
		red2.setAttribute("src","chrome://nettrust/skin/red.gif");
		red3.setAttribute("src","chrome://nettrust/skin/red.gif");
		red4.setAttribute("src","chrome://nettrust/skin/red.gif");
		red5.setAttribute("src","chrome://nettrust/skin/red.gif");
	break;
	
	case '-5':
		red1.setAttribute("src","chrome://nettrust/skin/red.gif");
		red2.setAttribute("src","chrome://nettrust/skin/red.gif");
		red3.setAttribute("src","chrome://nettrust/skin/red.gif");
		red4.setAttribute("src","chrome://nettrust/skin/red.gif");
		red5.setAttribute("src","chrome://nettrust/skin/red.gif");
	break;
	
	case '-10':
		alert("Warning: This website does not appear to be valid.");
	break;
	}
		
		
}


// Returns reference to open comment window or
//  null if no comment window is open
function getCommentsWin () {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
    .getService(Components.interfaces.nsIWindowMediator);
  var enumerator = wm.getEnumerator("nettrust:comments");
  if (enumerator.hasMoreElements())
    return enumerator.getNext();
  else
    return null;
}

// alert("nt.js loaded");
// Returns reference to comments window if successful, null otherwise.
function attachToCommentsWin () {
  var comWin;
  if (comWin = getCommentsWin()) {
    comWin.win = self;
    comWin.setView();
  }
  return comWin;
}


// Call this when social_network.rdf has changed
// re-loads MultiPersonaDB
function refreshAllWin(noSave) {
  if (!noSave) {
    NTSharedState.SNDB.savePersonaDBs(true); // local only flag
  }
  SNDB = new MultiPersonaDB(getSNIDs(),true); // local only flag

  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
    .getService(Components.interfaces.nsIWindowMediator);
  var enumerator = wm.getEnumerator("navigator:browser");

  while (enumerator.hasMoreElements()) {
    var win = enumerator.getNext();
    win.NTSharedState.SNDB = SNDB;
    win.document.getElementById("persona_menu").builder.refresh();
    win.do_process(win.document.getElementById("urlbar").value);
  }
  var comWin = getCommentsWin();

  if (comWin)
    comWin.setView();
}

// A simple history accessor that enumerates all urls in the Firefox history and
// returns a MyRateDB with entries for all http(s) urls in the history

function getHistory(n) {
 var historyDS = rdfService.GetDataSourceBlocking("rdf:history");

  // Nest three lines are necessary to initialize history since it opens lazily 
  // and a bug in GetAllResources() fails to do this.
  // See details in thread @ http://osdir.com/ml/mozilla.devel.rdf/2003-08/msg00064.html
  var root = rdfService.GetResource("NCHistoryByDate");
  var randPred = rdfService.GetAnonymousResource();
  historyDS.GetTargets(root,randPred,true);
  // Resuming with expected code

  var resources = historyDS.GetAllResources();
  var t = 
    '<nt-client-db id="1111111111111111" last="' +
    Math.floor((new Date()).getTime() / 1000) + 
    '" ver="0.0.2">\n</nt-client-db>';  

  var histDB = new MyRateDB(t);

  var i, url;
  for (i=0; (!n || i<n) && resources.hasMoreElements();i++) {
    var r = resources.getNext();
    if (r instanceof Components.interfaces.nsIRDFResource) {
      url = r.Value;
      if (url.search(/^http:\/\//) >=0 || url.search(/^https:\/\//) >=0) 
	histDB.updateWithVisit(url);
    }
  }

  return histDB;
}

