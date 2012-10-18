// override date.toString
// extends Date to output seconds since epoch instead of milliseconds

// Date.prototype.getUTC = 
//   function() {
//   return Math.floor(this.getTime() / 1000);
// }

// RateDB Object assumes that the XML str is valid 
// - this could be a potential vulnerability if not verified
// - need to check adherence to DTD once nailed down.

function RateDB (text) {
  this.DOM = (new DOMParser()).parseFromString(text, "application/xml");
  this.locs = this.DOM.getElementsByTagName("loc");
}

RateDB.maxCount = 5;
RateDB.prototype.maxCount = function () { return 5; };
// Initial time delay before ratings become valid (in ms)
RateDB.t_0 = 0;
RateDB.prototype.t_0 = function () { return 0; };
//RateDB.t_0 = 604800000;
// Time delay before ratings decay (in ms)
RateDB.t_d = 2419200000;
RateDB.prototype.t_d = function () { return 2419200000; };
// Decay constant
// c = 2.1979552909688778e-11 for a 1 year half life
RateDB.c = 2.1979552909688778e-11;
RateDB.prototype.c = function () { return 2.1979552909688778e-11; };

RateDB.trimURL = 
function (url) {
  var noProto = url.split("://")[1];
  var noCGI = noProto.split("?")[0];
  var l2 = noCGI.split("/");
  var res;
  if (l2.length < 3) {
    res = l2[0] + '/';
  } 
  else {
    res =  l2[0] + '/' + l2[1] + '/';
  }
  // First pattern strips www, second strips cgi that contains a /.
  return res.replace(/^www[0-9]?\./,"");
}

RateDB.prototype.trimURL = 
function (url) {
  var noProto = url.split("://")[1];
  var noCGI = noProto.split("?")[0];
  var l2 = noCGI.split("/");
  var res;
  if (l2.length < 3) {
    res = l2[0] + '/';
  } 
  else {
    var domain = l2[0] + "/";
    var dir = l2[1];
    // Strip out revealing first directories; i.e. those with the form ~<account-name> -- "~atsow" for instance
    if (NTHomophilyExp) {
      dir = dir.match(/^~/) ? "": dir + "/" ;
    }
    res =  domain + dir;
  }
  // First pattern strips www, second strips cgi that contains a /.
  return res.replace(/^www[0-9]?\./,"");
}

// The proper place for locToRating, but... (see next def)
RateDB.locToRating =
  function (loc, date) {
  try {
    var els = loc.getElementsByTagName("*");
    switch(els[0].tagName) {
    case "visit":
      var count = parseFloat(els[0].getAttribute("count"));
      // Date is stored in seconds, but js native is in ms
      var init = new Date(+els[0].getAttribute("init") * 1000);
      var last = new Date(+els[0].getAttribute("last") * 1000);
      var now = date;
      var d_0 = now.getTime() - init.getTime();
      var d_n = now.getTime() - last.getTime();
      var x = 
	d_0 < RateDB.t_0 ? 0 : 
	(d_n < RateDB.t_d ? count : 
	 Math.min(RateDB.maxCount,Math.max(count/2, count/Math.exp(RateDB.c*d_n))));
      return x;
      break;
    case "xprate":
      return parseFloat(els[0].getAttribute("val"));
      break;
    }
  } catch (e) {alert(e)};
}
// ... but locToRating needs to be in the prototype to remain accessible 
RateDB.prototype.locToRating =
  function (loc, date) {
  try {
    var els = loc.getElementsByTagName("*");
    switch(els[0].tagName) {
    case "visit":
      var count = parseFloat(els[0].getAttribute("count"));
      // Date is stored in seconds, but js native is in ms
      var init = new Date(+els[0].getAttribute("init") * 1000);
      var last = new Date(+els[0].getAttribute("last") * 1000);
      var now = date;
      var d_0 = now.getTime() - init.getTime();
      var d_n = now.getTime() - last.getTime();
//       var x = 
// 	d_0 < RateDB.t_0 ? 0 : 
// 	(d_n < RateDB.t_d ? count : 
// 	 Math.min(RateDB.maxCount,Math.max(count/2, count/Math.exp(RateDB.c*d_n))));
      var x = 
	d_0 < this.t_0() ? 0 : 
	(d_n < this.t_d() ? count : 
	 Math.min(this.maxCount(),Math.max(count/2, count/Math.exp(this.c()*d_n))));
      return x;
      break;
    case "xprate":
      return parseFloat(els[0].getAttribute("val"));
      break;
    }
  } catch (e) {alert(e)};
}

RateDB.prototype.getID =
  function() {
  return this.DOM.firstChild.getAttribute("id");
}

RateDB.prototype.lookupInd = 
function (key) {
  var len = this.locs.length;
  var top = len;
  var bot = 0;
  var i;
  // invariant: 
  //  top is one beyond the possible range
  //  bot is the first possible candidate
  while ( bot != top ) {
    i = Math.floor((bot+top)/2);
    val = this.locs[i].getAttribute("id");
    if (val == key) {
      return i;
    } 
    else if (val < key) {
      bot = i + 1;
    }
    else {
      top = i;
    }
  }
  return - (bot + 1);
};


RateDB.prototype.lookupComment =
  // Returns text of comment if exists
  // Returns null otherwise
  function (url) {
  //  alert("lookupComment(" + url +")");
  //  var i = RateDB.prototype.lookupInd.apply(this,new Array(RateDB.trimURL(url)));
  var i = this.lookupInd(this.trimURL(url));
  if (i < 0) 
    return null;
  this.locs[i].normalize();
  var comments = this.locs[i].getElementsByTagName("comment");
  return comments.length == 0 ? null : (comments[0].hasChildNodes() ? comments[0].firstChild.data : null);
};


RateDB.prototype.lookupLoc = 
  // This returns 
  //  - null in case the record is not in the db
  //  - the record
  function (url) {
  //  var loc = RateDB.trimURL(url);
  var loc = this.trimURL(url);
  //  var args = new Array(loc);
  //  var i = RateDB.prototype.lookupInd.apply(this, args);
  var i = this.lookupInd(loc);
  if (i < 0) { return null; }
  else {
    return this.locs[i];
  }
};

RateDB.prototype.lookupRating = 
  // This returns 
  //  - null in case the record is not in the db
  //  - the decay adjusted rating otherwise, using the current date
  function (url) {
  //  var i = RateDB.prototype.lookupInd.apply(this,new Array(RateDB.trimURL(url)));
  var i = this.lookupInd(this.trimURL(url));
  if (i < 0) { return null; }
  else {
    return this.locToRating(this.locs[i],new Date());
  }
};



RateDB.prototype.toString = function () { return (new XMLSerializer()).serializeToString(this.DOM); };


// This extends RateDB with mutable structure
// - adds updateWithVisit, updateWith
function MyRateDB (text) {
  this.DOM = (new DOMParser()).parseFromString(text, "application/xml");
  this.locs = this.DOM.getElementsByTagName("loc");
}

// Minimum amount of time before an updateWithVisit can change db
// An hour wait
MyRateDB.t_min = 3600000;
MyRateDB.prototype.t_min = function () { return 3600000;};


// Use the methods of RateDB
MyRateDB.prototype.maxCount = RateDB.prototype.maxCount;
MyRateDB.prototype.t_0 = RateDB.prototype.t_0;
MyRateDB.prototype.t_d = RateDB.prototype.t_d;
MyRateDB.prototype.c = RateDB.prototype.c;


MyRateDB.prototype.locToRating = RateDB.prototype.locToRating;
MyRateDB.prototype.trimURL = RateDB.prototype.trimURL;
MyRateDB.prototype.getID = RateDB.prototype.getID;
MyRateDB.prototype.lookupLoc = RateDB.prototype.lookupLoc;
MyRateDB.prototype.lookupInd = RateDB.prototype.lookupInd;
MyRateDB.prototype.lookupRating = RateDB.prototype.lookupRating;
MyRateDB.prototype.lookupComment = RateDB.prototype.lookupComment;
MyRateDB.prototype.toString = RateDB.prototype.toString;

// Updates DB with visit at current time
// Returns resulting record
MyRateDB.prototype.updateWithVisit =
  function (url) {
  var db = this.DOM;
  var locs = this.locs;
  var id = this.trimURL(url);
  var date = new Date();
  var maxCount = this.maxCount();

  var makeLoc = function(id,date) {
    var visit = db.createElement("visit");
    visit.setAttribute("init", Math.floor(date.getTime() / 1000));
    visit.setAttribute("count", 1);
    visit.setAttribute("last", Math.floor(date.getTime() / 1000));
    var loc = db.createElement("loc");
    loc.setAttribute("id", id);
    loc.appendChild(db.createTextNode("\n    "));
    loc.appendChild(visit);
    loc.appendChild(db.createTextNode("\n  "));
    return loc;
  }
  
  //  var i = RateDB.prototype.lookupInd.apply(this,new Array(id));
  var i = this.lookupInd(id);

  // Insert record if not in DB
  if (i < 0) {
    var ins = -(i + 1);
    i = ins;
    // Following doesn't work in degenerate case where there are no locs
    //    var p = locs[0].parentNode;
    var p = this.DOM.firstChild;
    if (ins == locs.length) {
      p.appendChild(db.createTextNode("  "));
      p.appendChild(makeLoc(id,date));
      p.appendChild(db.createTextNode("\n"));
    } 
    else {
      p.insertBefore(makeLoc(id,date),locs[ins]);
      p.insertBefore(db.createTextNode("\n  "),locs[ins+1]);
    }
  } 
  // Split on type of record
  else {
    var els = locs[i].getElementsByTagName("*");
    switch(els[0].tagName) {
    case "visit":
      var count = parseFloat(els[0].getAttribute("count"));
      var newCount = Math.min(maxCount,Math.ceil(count)+1);
      // Date is stored in seconds, but js native is in ms
      var last = new Date(+els[0].getAttribute("last") * 1000);
      // guard according to time window
      if (date.getTime() - last.getTime() > this.t_min()) {
	els[0].setAttribute("count",  newCount);
	els[0].setAttribute("last", Math.floor(date.getTime() / 1000));
      }
      break;
    case "xprate":
      break;
    }
  }

  // Experimental insturmentation
  // This time-stamps every call to updateWithVisit() in a given persona
  // by appending an <exp-visit> tag to the appropriate <loc> record.
  if (NTHomophilyExp) {
    var loc = locs[i];
    var expVisits = loc.getElementsByTagName("exp-visit");

    var time = Math.floor(date.getTime() / 1000);
    // Ensure 2 minute window.
    if ( expVisits.length == 0 || 
	 (time - expVisits[expVisits.length - 1].getAttribute("time") > 120)) {
      var expEle = this.DOM.createElement("exp-visit");
      expEle.setAttribute("time", time);
      loc.appendChild(db.createTextNode("  "));
      loc.appendChild(expEle);
      loc.appendChild(db.createTextNode("\n  "));
    }

  }
  // End experimental insturmentation

  return locs[i];
};

MyRateDB.prototype.updateWithXPRate =
  // Assumes that rate is a non-zero integer between -5 ... 5 (inclusive)
  function (url, rate) {
  var xprate = this.DOM.createElement("xprate");
  xprate.setAttribute("val", rate);
  var loc = this.lookupLoc(url);
  if (loc) { //update record
    var els = loc.getElementsByTagName("*");
    loc.replaceChild(xprate,els[0]);
    return loc;
  }
  else { // create new record, then re-issue update.
    this.updateWithVisit(url);
    return this.updateWithXPRate(url,rate);
    //    alert ("Can't explicitly rate non-existent record");
    //    return null;
  }
};

MyRateDB.prototype.updateWithComment =
  // Either replaces or creates comment field
  function (url, text) {
  var comment = this.DOM.createElement("comment");
  // Trim leading and trailing spaces
  var ctext = text.replace(/^\s*/,"").replace(/\s*$/,"");
  var emptyComment = ctext.length == 0;
  comment.appendChild(this.DOM.createTextNode(ctext));
  var loc = this.lookupLoc(url);
  if (loc) { //update record
    var els = loc.getElementsByTagName("comment");
    if (els.length != 0) {
      // maintain invariant that there are no childless comment elements
      if (emptyComment) {
	//	alert("updateWithComment() removing empty comment from " + url);
	loc.removeChild(loc.childNodes[2]);
	loc.removeChild(loc.childNodes[2]);
      }
      else 
	loc.replaceChild(comment,els[0]);
    } 
    else if (!emptyComment) {
      loc.appendChild(this.DOM.createTextNode("  "));
      loc.appendChild(comment);
      loc.appendChild(this.DOM.createTextNode("\n  "));
    }
    return loc;
  }
  else { // create new record, then re-issue update.
    this.updateWithVisit(url);
    return this.updateWithComment(url,text);
    //    alert ("Can't comment on non-existent record");
    //    return null;
  }
};


// This is for loading profile data and generating a full NT rating
// with one command.

// ProRateDB
// .getRating(url)
// .myDBtoDisk()
// .updateWithX
// The updates will simply wrap the methods of MyRateDB

function ProRateDB (myID, budIDs /* optional */, local) {
  // DBs[0] is myDB
  // DBs[i] 0 < i, is a buddy DB
  this.DBs = [];
  this.DBs[0] = new MyRateDB(NTsync.getDB(myID, true, local));
  for (var i = 1; i <= budIDs.length; i++) {
    this.DBs[i] = new RateDB(NTsync.getDB(budIDs[i-1], false, local));
  }
}

ProRateDB.prototype.updateWithVisit = function(url) {return this.DBs[0].updateWithVisit(url);};
ProRateDB.prototype.updateWithXPRate = function(url, rate) {return this.DBs[0].updateWithXPRate(url, rate);};
ProRateDB.prototype.updateWithComment = function(url, text) {return this.DBs[0].updateWithComment(url, text);};

// returns object with fields:
// - posCount, negCount, comCount, pID, posAvg, negAvg
ProRateDB.prototype.lookupAggRatingData =
  function (url) {

  var res = {posCount:0, negCount:0, comCount:0, pID:"0000000000000000"};
  var i, rate, posAcc=0, negAcc=0, com;

  for (i=0; i < this.DBs.length; i++) {
    rate = this.DBs[i].lookupRating(url);
    if (rate) {
      res.comCount +=  this.DBs[i].lookupComment(url) ? 1 : 0;
      if (0 <= rate) { 
	posAcc += rate;
	res.posCount++;
      } 
      else if (0 > rate) {
	negAcc += rate;
	res.negCount++;
      }
    }
  }

  res.posAvg = res.posCount == 0 ? 0 : posAcc/res.posCount;
  res.negAvg = res.negCount == 0 ? 0 : negAcc/res.negCount;
  res.pID = this.DBs[0].getID();
  res.toString = function() {
    var m = "";
    for (i in res) {
      m += i + " : "  + res[i] +"\n";
    }
    return m;
  }
  return res;
}

ProRateDB.prototype.lookupFullRatingData =
  function (url) {

  var i, res = new Array();

  for (i=0; i < this.DBs.length; i++) {
    var loc = this.DBs[i].lookupLoc(url);
    if (loc) {

      loc.normalize();
      var com = loc.getElementsByTagName("comment");
      com = com.length == 0 ? "" : (com[0].hasChildNodes() ? com[0].firstChild.data : "");

      var tmp = new Array();
      tmp.push(this.DBs[i].DOM.firstChild.getAttribute("id"));
      tmp.push(com);
      tmp.push(this.DBs[0].locToRating(loc,new Date()));

      res.push(tmp);

    } 
    // always want to report non-rating of user-persona---i.e., when i==0
    else if (i==0) {
      var tmp = new Array();
      tmp.push(this.DBs[i].DOM.firstChild.getAttribute("id"));
      tmp.push("");
      tmp.push("0");

      res.push(tmp);
    }
  }

  res.toString = function() {
    var i;
    var m = "{";
    for (i=0; i< res.length; i++) {
      m += "{" + res[i][0] + "," + res[i][1] + "," + res[i][2] + "}";
    }
    return m + "}";
  }

  return res;
}


ProRateDB.prototype.saveMyRateDB = 
  // saves the ratings DB under the name <ntid>.xml
  function (/* optional */ local) {
  this.DBs[0].DOM.firstChild.setAttribute("ver", "0.0.2");    
  this.DBs[0].DOM.firstChild.setAttribute("last", Math.floor((new Date()).getTime() / 1000));
  var id = this.DBs[0].DOM.firstChild.getAttribute("id");

  // Experimental insturmentation
  // record social network
  if (NTHomophilyExp) {
    var friends = getFriendIDs(make_hex_to_quat_dotted_hex(id));
    this.DBs[0].DOM.firstChild.setAttribute("ver", "0.0.3");    
    this.DBs[0].DOM.firstChild.setAttribute("sn", friends.slice(1,friends.length));    
  }
  // end experimental insturmentation

  var text = this.DBs[0].toString();
  NTsync.setDB(id,text,local);
}


// MultiPersonaDB
// - new creates an order-sensitive  
// loads all ProfileDB for every 

// Fields:
// - 

// Methods:
// - lookupAggRatingData returns ratings from least sensitive persona and personal name
// - lookupFullRatingData returns ratings from least sensitive persona and personal name
// - updateWithX(url, <opt-val>, personaID)

// Accepts an array of non-empty arrays of NTIDs.
// - the first NTID is the persona ID
// - the first one is always the private one?
// - the private one is implied.

  function MultiPersonaDB(personaSNs /* optional */, local) {

  this.SNDBs = [];
  // initialize the "private persona"
  this.SNDBs[0] = new ProRateDB("0000000000000000", [], true); // never update server (e.g. local == true)
  // add other personas and networks
  var i, a;
  for (i=0; i<personaSNs.length; i++) {
    a = personaSNs[i];
    this.SNDBs[1+i] = new ProRateDB(a[0], a.slice(1,a.length), local);
  }
};


MultiPersonaDB.prototype.lookupAggRatingData  = 
// returns the AggRatingData for the first SN that contains it,
//  null otherwise
  function (pID, url) {
  var pDB = this.readPolicy(pID, url);
  if (pDB)
    return pDB.lookupAggRatingData(url);
  else {
    var res = {posCount:0, negCount:0, comCount:0, posAvg:0, negAvg:0};
    res.pID = pID;
    return res;
  }
};

// returns first ratings if exists, null otherwise
MultiPersonaDB.prototype.lookupFullRatingData = 
  function (pID, url) {
  var pDB = this.readPolicy(pID, url);
  if (pDB)
    return pDB.lookupFullRatingData(url);
  else
    return null;
};


// Write policy is likely to change.
// For now, we assume that the SNs have disjoint histories
// Might include a hook that maps <pID>,<url> --> <pID> in the MultiPersonaDB context
// writePolicy
// readPolicy

// Takes current pID and url, returns appropriate profile for reading
// should it return a null?
// This implements a first-available policy, which makes sense when the accounts
// are completely partitioned
// Accepts pIDs, with no colons, including "null"
// if pID corresponds to an account, it returns the corresponding profile structure when 
// no other one matches.

MultiPersonaDB.prototype.readPolicy =
  function (pID, url) {
  var i, pDB = null;

  for (i=0; i<this.SNDBs.length; i++) {
    if (this.SNDBs[i].DBs[0].getID() == pID)
      pDB = this.SNDBs[i];
    if (this.SNDBs[i].DBs[0].lookupLoc(url))
      return this.SNDBs[i];
  }
  return pDB;
}

// Takes current pID and url, returns appropriate profile for writing
// This policy assumes disjoint histories.
// Accepts pIDs, with no colons, including "null"
// returns pID if pID contains loc or if no other persona contains loc
//  otherwise returns null

MultiPersonaDB.prototype.writePolicy =
  function (pID, url) {
  var i, temp, pDB;

  // Ensure that no other persona has this url
  for (i=0; i<this.SNDBs.length; i++) {
    temp=this.SNDBs[i];
    // Bind appropriate ProRateDB
    if (temp.DBs[0].getID()==pID) {
      pDB = temp;
      // defers to requested pID when it contains url
      if (pDB.DBs[0].lookupLoc(url))
	return pDB;
    }
    // If empty, confirm that its not in another persona
    else if (temp.DBs[0].lookupLoc(url))
      return null;
  }
  return pDB;
}



MultiPersonaDB.prototype.updateWithVisit = 
  // Returns: ID of persona updated (potentially different from input pID on success, null on failure
  // Effects: updates record of persona determined by write policy, none if write policy fails
  function (pID, url) {
  var pDB = this.writePolicy(pID, url);
  if (pDB) {
    pDB.updateWithVisit(url);
    return pDB.DBs[0].getID();
  }
  else
    return null;
};


MultiPersonaDB.prototype.updateWithXPRate     = 
  // Returns: ID of persona updated (potentially different from input pID on success, null on failure
  // Effects: updates record of persona determined by write policy, none if write policy fails
  function (pID, url, rate) {
  var pDB = this.writePolicy(pID, url);
  if (pDB) {
    pDB.updateWithXPRate(url, rate);
    return pDB.DBs[0].getID();
  }
  else
    return null;
};


MultiPersonaDB.prototype.updateWithComment    = 
  // Returns: ID of persona updated (potentially different from input pID on success, null on failure
  // Effects: updates record of persona determined by write policy, none if write policy fails
  function (pID, url, text) {
  var pDB = this.writePolicy(pID, url);
  if (pDB) {
    pDB.updateWithComment(url, text);
    return pDB.DBs[0].getID();
  }
  else
    return null;
};

MultiPersonaDB.prototype.savePersonaDBs = 
  // Need to handle private persona specially, ---bypass sync, just use filesys---
  // Returns:
  // Effects:
  function (/* optional */ local) {
  var pID = this.SNDBs[0].DBs[0].getID();
  var text = this.SNDBs[0].DBs[0].toString();
  writeExtFile(pID+".xml", text);

  var i;
  for(i=1;i<this.SNDBs.length; i++)
    this.SNDBs[i].saveMyRateDB(local);

};



function makeCoherentDB (SNDB) {
  var f = function(inst, pID, url, /* optional */ val) {

    switch(inst) {
    case "lookupAggRatingData":
    return SNDB.lookupAggRatingData(pID, url);
    case "lookupFullRatingData":
    return SNDB.lookupFullRatingData(pID, url);
    case "updateWithVisit":
    return SNDB.updateWithVisit(pID, url);
    case "updateWithXPRate":
    return SNDB.updateWithXPRate(pID, url, val);
    case "updateWithComment":
    return SNDB.updateWithComment(pID, url, val);
    case "savePersonaDBs":
    return SNDB.savePersonaDBs(pID, url, val);
    case "refreshPersonaDBs":
    SNDB = new MultiPersonaDB(getSNIDs());
    }
  }
  return f;
}
