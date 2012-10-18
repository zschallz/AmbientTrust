// expects XXXX:XXXX:XXXX:XXXX format for srcID
//

function NTExportPersonaInvitation (srcID, tarEmail) {
  var ext = Components.classes["@mozilla.org/extensions/manager;1"]
    .getService(Components.interfaces.nsIExtensionManager)
    .getInstallLocation(id)
    .getItemLocation(id);
    

  //generate the full path, doing replacements on special characters
  var full_filename='file:///'+
    ext.path.replace(/\\/g, '\/').replace(/^\s*\/?/, '').replace(/\ /g, '%20')
    +'/chrome/content/data/social_net.rdf';
	
  var fileDS = rdfService.GetDataSourceBlocking(full_filename);
  var subject = rdfService.GetResource("http://www.nettrust-site.net/user/"+ srcID);
  
  var props = {id:null, nym:null, blinder:null, email:null};
  var out = "target " + tarEmail + "\n";

  var p;
  for(p in props) {
    var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#"+ p);
    var x = fileDS.GetTarget(subject, predicate, true);
    if (x instanceof Components.interfaces.nsIRDFLiteral) {
      props[p] = x.Value;
      out += p + " " + x.Value + "\n";
    }
    else
      alert("NTExportPersonaInvitation("+ srcID + ", " + tarEmail +") failed.");

  }

  // ======================================================================
  // Time to export
  // ======================================================================

  const nsIFilePicker = Components.interfaces.nsIFilePicker;

  var fp = Components.classes["@mozilla.org/filepicker;1"]
                   .createInstance(nsIFilePicker);
  fp.init(window, "Save Invitation", nsIFilePicker.modeSave);
  fp.appendFilter("Net Trust Invitations",".inv;");
  fp.appendFilters(nsIFilePicker.filterAll);

  fp.defaultString = props["nym"]+"-"+tarEmail+".inv";
  var rv = fp.show();
  if (rv == nsIFilePicker.returnOK)
  {
    var file = fp.file;
    // Get the path as string. Note that you usually won't
    // need to work with the string paths.
    var path = fp.file.path;
    // work with returned nsILocalFile...

    //now we write the file
    writeFile(path,out);
//    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
//                          .createInstance(Components.interfaces.nsIFileOutputStream);

//     // use 0x02 | 0x10 to open file for appending.
//     foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate
//     foStream.write(out, out.length);
//     foStream.close();
  }

}

function NTImportContact (chkBlinder, chkTarget) {
  const nsIFilePicker = Components.interfaces.nsIFilePicker;
  var fp = Components.classes["@mozilla.org/filepicker;1"]
	           .createInstance(nsIFilePicker);
  fp.init(window, "Add Contact", nsIFilePicker.modeOpen);
  fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

  var rv = fp.show();
  if (rv == nsIFilePicker.returnOK) {
    var file = fp.file;
    // Get the path as string. Note that you usually won't 
    // need to work with the string paths.
    var path = fp.file.path;
    // work with returned nsILocalFile...
    //now we read date from the file
    var text=readFile(path);


    // Validate data

    // validation RegExps

    var id, nym, blinder, email, arr;
    arr=text.match(/^id (.*)$/m);
    if (arr && arr.length > 1 && arr[1].match(idRE)) 
      id = arr[1];
    else return null;
    arr=text.match(/^nym (.*)$/m);
    if (arr && arr.length > 1 && arr[1].match(nymRE)) 
      nym = arr[1];
    else return null;
    arr=text.match(/^blinder (.*)$/m);
    if (arr && arr.length > 1 && arr[1].match(blinderRE)) 
      blinder = arr[1];
    else return null;
    arr=text.match(/^email (.*)$/m);
    if (arr && arr.length > 1 && arr[1].match(emailRE)) 
      email = arr[1];
    else return null;

    // Check blinder consistency
   if (chkBlinder && 
       (id.split(":").join("") != 
	hex_md5(parseInt(blinder).toString(16)+nym+email).toString().slice(16,32))) {
      alert("Invitation failed checksum");
      return null;
    }

    if (chkTarget) {
      arr=text.match(/^target (.*)$/m);
      if (arr && arr.length > 1 && arr[1].match(emailRE)) 
	var tarEmail = arr[1];
      else return null;
    }

    alert ("Parsed data:\n" + id + "\n" + nym + "\n" + email + "\n"  + blinder);



    // Ensure Invitation Target is present; e.g. the target email address

    // prompt for sender's email address?

    // call add_friend()
    add_validated_friend(id, nym, blinder, email)
    return 1;
  }
  return null;
}

//alert("loaded invite.js");
function exportPersona() {
  // window.openDialog('chrome://nettrust/content/invite.xul', 'invite', 'chrome,resizable=yes,centerscreen=yes,modal=yes,alwaysRaised=yes');
  var nymList = document.getElementById("persona_list");
  var nym = nymList.getSelectedItem(0).value;
  var tarEmail = document.getElementById("target-email").value;
  NTExportPersonaInvitation(nym,tarEmail);
  return;
}

function guardExportButton () {
  var eBut = document.getElementById("export-persona");
  var tarEmail = document.getElementById("target-email");
  var pList = document.getElementById("persona_list");
  var p1 = tarEmail.value.match(emailRE);
  if (p1 && pList.selectedIndex >= 0)
    eBut.disabled = false;
  else
    eBut.disabled = true;
}


// Matching constants
var idRE = /^(?:[a-fA-F0-9]{4}:){3}[a-fA-F0-9]{4}$/;
var nymRE = /^[A-Za-z0-9!@#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!@#$%&'*+/=?^_`{|}~-]+)*$/;
var emailRE = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Za-z]{2}|edu|com|org|net|gov|biz|info|name|aero|biz|info|jobs|museum)$/;
var blinderRE = /^\d+$/;
