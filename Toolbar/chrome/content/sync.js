// This file defines functions for accessing the ratings dbs
// The goal is to abstract the synchronization process from the 
//  the data-loading. 

// Design Assumptions:
// - Authoritative buddy dbs are stored remotely
//  - implies that one only needs server-read for buddy dbs
// - Authoritative persona dbs are stored locally
//  - implies that one only needs server-write for persona dbs

// Version 0
// - local file access only
//  - creates empty dbs if they don't exist
// Need to integrate with the ProRateDB object
// Should add-persona alert the synchronization manager?
// What sort of error reporting/handling should happen here?

// Version 1
// - always writes current version of persona db to server on load
// - always checks server for most recent version of buddies.
//  - supplies empty file if they don't exist

// Version 2
// - adds authentication for persona writes
//  - need to interact with SN to extract authentication credentials
// - delays server writes to limit real-time monitoring of users
// - delays server buddy checking to conceal social network
//  - maintains randomized schedule to sync buddies

// Long-term vision
// - Tor integration will prevent SN identification by server
// - Could eventually mask a true peer deployment.
//  - possibly leverage gnutella or other existing peer dist.
//  - would be necessary to sign data to prevent spoofing.

var NTsync = {};


// Version 0 implementation

// Expects ID to be presented as 0-prefixed 64-bit string w/o colons
// returns text -- possible error bundling?
NTsync.getDB = function(id, isMine /* optional */, local) {
  // Is it stored locally?
  // If so, return it
  // else, create empty -- possibly throw error?
  var makeEmptyDB = function (id) {
    return '<nt-client-db id="' + 
    //    id +'" last="' + (new Date()).getUTC() + 
    id +'" last="' + Math.floor((new Date()).getTime() / 1000) + 
    '" ver="0.0.2">\n</nt-client-db>';  
  };

  var getDBLocally = function () {
    var text;
    try {
      text = read_and_upgrade_db_file(id);
      //      text = readExtFile(id + ".xml");
      //      alert("NTsync.getDB(" + id+")\n" + "Local read success.\n\n" + text);
      return text;
    }
    catch(e) {
      // gross catch -- no error analysis
      text = makeEmptyDB(id);
      writeExtFile(id+".xml", text);
      // alert("NTsync.getDB(" + id+")\n" + "Local read failed.\n Creating fresh db:\n" + text);
      return text;
    }
  }

  if (isMine) {
    text = getDBLocally();
    if (!local) { // update server
      // JS doesn't seem to building closures correctly, e.g. the text value is not caputed
      // instead, I'm going to make 'text' a formal variable to the function.
      // send_xml_file() will invoke the function on its version of 'text'
      //      var onSuccess = function () { 
      var onSuccess = function (text) {
	//	alert("Successfully sent " + id);
	var newText = NTsync.removeExpData(text);
	writeExtFile(id +".xml", newText);
	//	alert("Successfully converted and written " + id + ".xml\n" + newText);
	refreshAllWin(true); // optional no-save flag set so that
      };
      send_xml_file(id, (NTHomophilyExp ? onSuccess : null));
    }
    return text;
  }


  if (!local) {
    // Hit the server first
    var request_data="?com=ratings&id="+make_hex_to_quat_dotted_hex(id);
    var xmlhttp=new XMLHttpRequest();
  
    xmlhttp.onreadystatechange = function () {
      if (xmlhttp.readyState == 4) {
	if(200 == xmlhttp.status ) {
	  //alert("got a response");
	  var text=xmlhttp.responseText;

	  // A good opportunity for well-formedness checking
	  if (null == text){
	    //	alert("error: null response, returning empty db");
	    return;
	  }
	  writeExtFile(id+".xml", text);
	  text = read_and_upgrade_db_file(id);
	  // alert("Download success, " + id + "\nRefreshing toolbar" + text);
	  refreshAllWin();
	}
	else
	  alert("Failure in downloading ratings for "+ id + ".\nError" +xmlhttp.status + ":" + xmlhttp.statusText);
      }
    };

    xmlhttp.open("GET",read_url+request_data,true);
    xmlhttp.send(null);
  }
  return getDBLocally();


  //  alert("xmlhttp.send(null);\nreturns");
  //now we start to decode...
//   if(200 == xmlhttp.status ){
//     //alert("got a response");
//   }
//   else{
//     alert("error" +xmlhttp.status + ":" + xmlhttp.statusText);
//     return getDBLocally();
//   }
//   var text=xmlhttp.responseText;

//   // A good opportunity for well-formedness checking
//   if (null == text){
//     alert("error: null response, returning empty db");
//     return makeEmptyDB(id);
//   }
//   writeExtFile(id+".xml", text);
//   text = read_and_upgrade_db_file(id);
//   return text;
};

NTsync.setDB = function(id,text, /* optional */ local) {
  // Write locally
  writeExtFile(id+".xml", text);
};

function rebuildDB(text) {

  var db = new RateDB(text);
  var locs = new Array();
  var p = db.DOM.firstChild;
  var i,len; 

  // clear out db DOM and move loc DOMs to locs[]
  for (i = 0, len = db.locs.length; i < len; i++) {
    locs[i] = p.removeChild(db.locs[0]);
  }

  // Clear whitespace
  p.normalize();
  p.removeChild(p.firstChild);
  p.insertBefore(db.DOM.createTextNode("\n"),null);


  // Update version number
  p.setAttribute("ver", "0.0.2");

  // Rebuild by trimming and inserting
  for (i = 0; i < locs.length; i++) {

    // Strip www[0-9] from url
    var newID = locs[i].getAttribute("id").replace(/^www[0-9]?\./,"");
    locs[i].setAttribute("id", newID);

    // Remove empty comments
    var com = locs[i].getElementsByTagName("comment");
    if (com.length > 0) {
      var ctext = com[0].firstChild.data.replace(/^\s*/,"").replace(/\s*$/,"");
      if (ctext.length == 0) {
	locs[i].removeChild(loc[i].childNodes[2]);
	locs[i].removeChild(loc[i].childNodes[2]);
      } 
      else 
	com[0].firstChild.data = ctext;
    }
    

    // Rebuild sorted list
    var j = db.lookupInd(newID);
    // insert when not in array
    if (j<0) {
      j = -(j + 1);
      if (j == db.locs.length) {
	p.insertBefore(db.DOM.createTextNode("\n  "),p.lastChild);
	p.insertBefore(locs[i],p.lastChild);
	//	alert("Insert last");
      } 
      else {
	p.insertBefore(locs[i],db.locs[j]);
	p.insertBefore(db.DOM.createTextNode("\n  "),db.locs[j+1]);
	//	alert("Insert prefix");
      }
      //      alert(db);
    } 
    // should merge in case of collision.
    // but beginning with a first-come-first-serve policy
    else {
      //      alert("Collision @" + newID);
    }
  }
  return db.toString();
}


function read_and_upgrade_db_file(id) {
  var text = readExtFile(id+".xml");
  var dom = (new DOMParser()).parseFromString(text, "application/xml");
  var ver = dom.firstChild.getAttribute("ver");
  var newText;
  switch (ver) {
  case "0.0.1":
    newText = rebuildDB(text);
    writeExtFile(id+"-0.0.1.xml",text);
    writeExtFile(id+".xml",newText);
    return newText;
    break;
  case "0.0.2":
    return text;
    break;
  case "0.0.3":
    if (NTHomophilyExp)
      return text;
    else {
      //      alert("Converting "+id + " to 0.0.2")
      newText = NTsync.removeExpData(text);
      writeExtFile(id+"-0.0.3.xml",text);
      writeExtFile(id+".xml",newText);
      return newText;
    }
    break;
  default:
    alert("read_and_upgrade_db_file()\nUnrecognized db file format: " + id +".xml");
    return text;
  }
}

// setTimeout(syncAlert,5000);

// function syncAlert () {
//   alert("5 seconds have passed!");
//   setTimeout(syncAlert,5000);
// }
// alert("sync.js loaded");

// uses regular expressions to strip experimental data, although
// parsing into XML may actually be a better solution.

// Basically this turns the file from 0.0.3 to 0.0.2
NTsync.removeExpData = function(text) {
  var dom = (new DOMParser()).parseFromString(text, "application/xml");
  dom.normalize();

  // Test for 0.0.3

  // Set to 0.0.2
  dom.firstChild.setAttribute("ver", "0.0.2"); 

  // first strip out the SN
  //  dom.firstChild.setAttribute("sn", ""); 
  dom.firstChild.removeAttribute("sn"); 
  
  // then remove the experimental timestamps
  var expVisits = dom.getElementsByTagName("exp-visit");
  while (expVisits.length > 0) {
    var parent = expVisits[0].parentNode;
    parent.removeChild(expVisits[0].previousSibling); // spacing
    parent.removeChild(expVisits[0]); 
  }
  
  return (new XMLSerializer()).serializeToString(dom);
};
