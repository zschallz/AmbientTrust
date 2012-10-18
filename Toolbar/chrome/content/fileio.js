function readFile(path) {
  var file = Components.classes["@mozilla.org/file/local;1"]
    .createInstance(Components.interfaces.nsILocalFile);
  try { file.initWithPath(path);
    var data = "";
    var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
      .createInstance(Components.interfaces.nsIFileInputStream);
    var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"]
      .createInstance(Components.interfaces.nsIScriptableInputStream);
    fstream.init(file, -1, 0, 0);
    sstream.init(fstream); 
    
    var str = sstream.read(4096);
    while (str.length > 0) {
      data += str;
      str = sstream.read(4096);
    }
    sstream.close();
    fstream.close();
  }
  catch(e) { alert(e); }
  return data;
}

function writeFile(path, ftext) {
      var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
      file.initWithPath( path );
      var strm = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
      strm.init( file, 0x04 | 0x08, 420, 0 );
      strm.write( ftext, ftext.length );
      strm.close();
}

// Reads file relative to the '<extension>/chrome/content/data' directory
function readExtFile(path) {
  //  const id = "{65b3130e-8513-41b6-8ea8-43dbd9cc0bf5}";
  //  try {
    var file = Components.classes["@mozilla.org/extensions/manager;1"]
      .getService(Components.interfaces.nsIExtensionManager)
      .getInstallLocation(id)
      .getItemFile(id, "chrome/content/data/" + path);
    var data = "";
    var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
      .createInstance(Components.interfaces.nsIFileInputStream);
    var sstream = Components.classes["@mozilla.org/scriptableinputstream;1"]
      .createInstance(Components.interfaces.nsIScriptableInputStream);
    fstream.init(file, -1, 0, 0);
    sstream.init(fstream); 
    
    var str = sstream.read(16384);
    while (str.length > 0) {
      data += str;
      str = sstream.read(128000);
    }
    sstream.close();
    fstream.close();
    //  }
    //  catch(e) { alert(e); }
  return data;
}

// Writes file relative to the '<extension>/chrome/content/data' directory
function writeExtFile(path, ftext) {
  //  const id = "{65b3130e-8513-41b6-8ea8-43dbd9cc0bf5}";
  try {
    var file = Components.classes["@mozilla.org/extensions/manager;1"]
      .getService(Components.interfaces.nsIExtensionManager)
      .getInstallLocation(id)
      .getItemFile(id, "chrome/content/data/" + path);
    var strm = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
    strm.init( file, 0x04 | 0x08 | 0x20, 420, 0 );
    strm.write( ftext, ftext.length );
    strm.close();
  }
  catch(e) { alert(e); }
}


function deleteExtFile(path) {
  var file = Components.classes["@mozilla.org/extensions/manager;1"]
    .getService(Components.interfaces.nsIExtensionManager)
    .getInstallLocation(id)
    .getItemFile(id, "chrome/content/data/" + path);
  file.remove(false);
}
