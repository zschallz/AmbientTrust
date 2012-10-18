/*
personas.js: provides 
utilites for Personas XUL interface
author: Camilo Viecco, Praveen Veeramachaneni, and Alex Tsow 2007
*/
var xmlhttp;

// a stub for establishing global variables in the persona dialog
var personaWin = {};
var myArray = [];

// Should queue changes to social_net.rdf so that Cancel discards all edits.
// Interaction with this window should be "atomic" in the sense that either
// all the changes are made or none are made.  There should be no "change as you go".
// Accept will commit changes to rdf

// Easiest way to do this is to create a parallel rdf file that is renamed 
// to social_net.rdf on Accept.


// This function makes a copy of social_net.rdf, temp_social_net.rdf.
function init() {
  var ext = Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(id)
                    .getItemLocation(id);
  //generate the full path, doing replacements on special characters
  personaWin.fileURIstr='file:///'+
                      ext.path.replace(/\\/g, '\/').replace(/^\s*\/?/, '').replace(/\ /g, '%20')
                      +'/chrome/content/data/social_net.rdf';
  personaWin.fileDS = rdfService.GetDataSourceBlocking(personaWin.fileURIstr);
  personaWin.tempDS = parseRDFString(serializeDS(personaWin.fileDS), "chrome://nettrust/content/data/temp_social_net.rdf");

  // set persona_menu to temp datasource
  var personaMenu = document.getElementById("persona_menu");
  personaMenu.database.AddDataSource(personaWin.tempDS);
  personaMenu.builder.rebuild();

  var selectedIndex = window.opener.document.getElementById("persona_menu").selectedIndex;
  if (selectedIndex > 0) 
    personaMenu.selectedIndex = selectedIndex - 1;

  guardExportButton();
  refresh_social_net();
}

function fin() {
}


function doAccept () {

  // copies tempDS into fileDS
  var data = serializeDS(personaWin.tempDS);
  writeExtFile("social_net.rdf", data);
  personaWin.fileDS.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
  personaWin.fileDS.Refresh(true);

  var fileDS = rdfService.GetDataSourceBlocking("chrome://nettrust/content/data/social_net.rdf");
  fileDS.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
  fileDS.Refresh(true);
  
  window.opener.NTSharedState.SNDB.savePersonaDBs(true); // force a local save
  window.opener.refreshAllWin();

  close();
}

function doCancel () {
  close();
}




// Takes a datasource and returns a string

function serializeDS(ds) {
  var outputStream = {
  data: "",
  close : function(){},
  flush : function(){},
  write : function (buffer,count){
      this.data += buffer;
      return count;
    },
  writeFrom : function (stream,count){},
  isNonBlocking: false
  }

  var serializer=Components.classes["@mozilla.org/rdf/xml-serializer;1"]
    .createInstance(Components.interfaces.nsIRDFXMLSerializer);
  serializer.init(ds);

  serializer.QueryInterface(Components.interfaces.nsIRDFXMLSource);
  serializer.Serialize(outputStream);

  return outputStream.data;
}




function refresh_social_net(){
  load_persona_menu();
  load_friend_menu();
  populating_lists();
  //document.getElementById("social_net_browse_tree").builder.refresh();
  //document.getElementById("social_net_browse_tree").builder.rebuild();
  //document.getElementById("remove_persona_menulist").builder.refresh();
  //document.getElementById("men_it").builder.refresh();
  //document.getElementById("relationship_persona_menu").builder.refresh();
  //document.getElementById("relationship_friend_menu").builder.refresh();
  //document.getElementById("social_net_browse_tree").builder.refresh();
  //alert("refreshing social nework");
}


function load_history()
{


     
    var ext = Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(id)
                    .getItemLocation(id);
    var full_filename='file:///'+
                      ext.path.replace(/\\/g, '\/').replace(/^\s*\/?/, '').replace(/\ /g, '%20')
                      +'/chrome/content/data/social_net.rdf';
	//var fileDS = rdfService.GetDataSourceBlocking("file://D:\\indiana\\nettrust\\svn\\nettrust\\trunk\\Toolbar\\chrome\\content\\broadcaster.rdf");
    //    var fileDS = rdfService.GetDataSourceBlocking(full_filename);
  var fileDS = rdfService.GetDataSourceBlocking("chrome://nettrust/content/data/social_net.rdf");
  var folderRes = rdfService.GetResource("http://www.nettrust-site.net/social_net");
  var netid = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
  var nym = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");
  var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
  try {
    container.Init(fileDS, folderRes);
  }
  catch (ex){alert("problem here");}
  var i = 0;

  var children = container.GetElements();
  var name_nym= "";
  if(children.hasMoreElements()){
			  
    var child = children.getNext();
    if (child instanceof Components.interfaces.nsIRDFResource){
				 
      var target = fileDS.GetTarget(child, nym, true);
      if (target instanceof Components.interfaces.nsIRDFLiteral){
	    name_nym = name_nym + target.Value;
	
      }
     
      }
  }  
  //alert(name_nym);
  var a= name_nym.indexOf('@');
  a = a*1;
  var persona = name_nym.substring(0,a);
  //var persona = name_nym.substring(0,a);
  //alert(persona+"is persona");
   for (var i =1;i <= 10;i = i +1) 
    {
        //alert("came here"+persona);
        var j = i+"c";
        var k = i+"d";
        //alert(k + j);
        document.getElementById(j).label = persona+"@work" ;
        document.getElementById(k).label = persona+"@play";
    }
    
    
 }

// If this is the first time using NT, then this will create personas
// from the initialize.xul window
function init_button()
{


     var input=document.getElementById("init_nym").value;
	var input_email=document.getElementById("init_email").value;
	
	if(0 == input_email.length || 0==input.length){
		alert("Sorry, you need both a nym and email address to add a new persona");
		return;
		}
		
		var play = input+"@play";
	create_persona1(play, input_email);
	
	var work = input+"@work";
    create_persona1(work, input_email);
// 	document.getElementById("init_nym").value="";
// 	document.getElementById("init_email").value="";
// 	alert("New Users added sucessfully!"+ work + " and " +play);
// 	document.getElementById("init_nym").value="";
// 	document.getElementById("init_email").value="";
// 	window.opener.refreshAllWin();
// 	var box=document.getElementById("first");
//     box.setAttribute("hidden","true");
// 	var box1=document.getElementById("second");
//     box1.setAttribute("hidden","false");
	//window.open("chrome://nettrust/content/history_sort.xul", "bmarks", "chrome,width=400,height=300,resizable=yes");
    //document.getElementById("url").value = work ;
 	
}



function create_persona1(nym1, email1)
{
    
    var input_nym=nym1;
	var input_email= email1;
	
	if(0 == input_email.length || 0==input_nym.length){
		alert("Sorry, you need both a nym and email address to add a new persona");
		return;
		}
	//alert("WtF: in_nym="+input_nym +" in_email="+input_email);
	
	//-------------------	
	//check if there is already such a nym in the local db
	
	//get the extension's file directory, by using the extension id.
    // const id = "{65b3130e-8513-41b6-8ea8-43dbd9cc0bf5}";
    var ext = Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(id)
                    .getItemLocation(id);
    //generate the full path, doing replacements on special characters
    var full_filename='file:///'+
                      ext.path.replace(/\\/g, '\/').replace(/^\s*\/?/, '').replace(/\ /g, '%20')
                      +'/chrome/content/data/social_net.rdf';
	//var fileDS = rdfService.GetDataSourceBlocking("file://D:\\indiana\\nettrust\\svn\\nettrust\\trunk\\Toolbar\\chrome\\content\\broadcaster.rdf");
    var fileDS = rdfService.GetDataSourceBlocking(full_filename);
	
	//open the social net container..
    var social_net = rdfService.GetResource("http://www.nettrust-site.net/social_net");

    var container = Components.classes["@mozilla.org/rdf/container;1"].
                  createInstance(Components.interfaces.nsIRDFContainer);
    try {
      container.Init(fileDS, social_net);
    }
    catch (ex){
    	alert("Cannot initialize container");
       }
       
    var rdf_nym_res = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");   
       
	var stored_personas = container.GetElements();
	var stored_nym;
	while (stored_personas.hasMoreElements()){
    var child = stored_personas.getNext();
       if (child instanceof Components.interfaces.nsIRDFResource){
          //photosDS.Assert(child, ratingProp, threeProp, true);
       	  //do something here
          var target = fileDS.GetTarget(child, rdf_nym_res, true);
          if (target instanceof Components.interfaces.nsIRDFLiteral){
             stored_nym = target.Value;
             //alert("Got nym: "+stored_nym);
             if(stored_nym == input_nym){
               alert("Sorry, you alrady have such a nym");
               return;
             }
           }
          
       }
    }
	//---------------
    // Now, we know the input values AND the nym is not present
	//now we can try to connect to the server!
    
    //var dest_url="http://156.56.105.13/perl/nettrust.pl";

    //holy macarrel.. javacscript's random is of size 53 bits..
    // Looks like all math is done in doubles
    // but how random is the random? how much entropy has this
    // random function? 
    var blinding=Math.random()*281474976710656*32;
    var new_user_id=hex_md5(blinding.toString(16)+input_nym+input_email);
    //new_user_id=5;
    //and truncate
    //alert("new_id="+new_user_id);
    new_user_id=new_user_id.slice(16,32);
    new_user_id=make_hex_to_quat_dotted_hex(new_user_id);
    var auth_info=Math.random()*281474976710656*32;
    var auth_info=hex_md5(auth_info.toString(16));
    var user_id_asdecstring=new_user_id.toString(10);
    //return;
    
    var request_data="com=add_user&id="+new_user_id+"&auth_info="+auth_info;
    //var user_id_ashex_len=new_user_id.toString(16).length();
    //alert("adding persona id="+new_user_id + " request="+request_data);
    //alert(user_id_asdec_len + " "+user_id_ashex_len );
    xmlhttp=new XMLHttpRequest();
    xmlhttp.open("POST",dest_url,false);
    xmlhttp.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
    xmlhttp.send(request_data);
    //now we start to decode...
    if(200 == xmlhttp.status ){
    	//alert("got a response");
    }
    else{
    	alert("error" +xmlhttp.status + ":" + xmlhttp.statusText);
    	return;
    }
    var doc=xmlhttp.responseXML;
    if (null == doc){
    	alert("error: docuemnt received is not a valid XML file");
    }
    var rusr=doc.getElementsByTagName("user");
    //var rid=doc.getElementsByTagName("id");
    //alert("user_len="+rusr.length+ " con[0]="+rusr[0]);
    var rid=rusr[0].getAttribute("id");
    var rsalt=rusr[0].getAttribute("salt");
    var rhash=rusr[0].getAttribute("hash");
    //alert("user_id="+rid+" salt="+rsalt+" rhash="+rhash);
    if(null == rid || null == rsalt || null==rhash){
    	alert("Bad server response, try again");
    	return;
    }
    //test for return... values.
    var rtest=rsalt+hex_md5(auth_info);
    var rtest2=hex_md5(rtest);
    //alert("remote="+rhash +" local="+rtest2);
    if(rtest2!=rhash){
    	alert(" not equal remote="+rhash +" local="+rtest2);
    	return;
    }
    //alert("Equal remote="+rhash +" local="+rtest2);
    
    //----
    // Now to step 3:  Add it to the local rdf file..
    // two step.. prepare params.. then insert!
    var local_id=make_hex_to_quat_dotted_hex(rhash);
    var new_user_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/user/"+rid);
    var new_user_nym_literal=rdfService.GetLiteral(""+input_nym);
    var new_user_id_literal=rdfService.GetLiteral(""+rid);
    var new_user_blinder_literal=rdfService.GetLiteral(""+blinding);  
    var new_user_email_literal=rdfService.GetLiteral(""+input_email);
    var new_user_auth_info_literal=rdfService.GetLiteral(""+auth_info);   
    var type_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#type");
    var id_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
    var blinder_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#blinder");
    var email_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#email");
    var auth_info_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#authinfo");       
    var persona_literal=rdfService.GetLiteral("persona");
    //var container_literal=rdfService.GetLiteral("http://www.w3.org/1999/02/22-rdf-syntax-ns#Seq");
    //var container_resource = 
    //    rdfService.GetResource("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
    //var child_container = Components.classes["@mozilla.org/rdf/container;1"].
    //              createInstance(Components.interfaces.nsIRDFContainer);  
    var rdfContainerUtils = Components.classes["@mozilla.org/rdf/container-utils;1"].
                          getService(Components.interfaces.nsIRDFContainerUtils);
                  
    //and add..
    container.AppendElement(new_user_resource);
    fileDS.Assert(new_user_resource,rdf_nym_res,new_user_nym_literal,true);
    fileDS.Assert(new_user_resource,id_resource,new_user_id_literal,true);
    fileDS.Assert(new_user_resource,type_resource,persona_literal,true);
    fileDS.Assert(new_user_resource,email_resource,new_user_email_literal,true);
    fileDS.Assert(new_user_resource,blinder_resource,new_user_blinder_literal,true);
    fileDS.Assert(new_user_resource,auth_info_resource,new_user_auth_info_literal,true);
    //fileDS.Assert(new_user_resource,container_resource,container_literal,true);
    //child_container.Init(fileDS, new_user_resource);
    var child_container = rdfContainerUtils.MakeSeq(fileDS, new_user_resource);
    
    //alert success-remove later?
    //alert("New User added sucessfully!");
    //clean up values.
    
    //and refresh  
	fileDS.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
	fileDS.Flush();
    //refresh_social_net();
	
	//load_persona_menu();
}


function guardCreateButton () {
  var but = document.getElementById("create_personas_but");
  var email = document.getElementById("init_email");
  var nym = document.getElementById("init_nym");
  if (email.value.match(emailRE) && nym.value.match(nymRE))
    but.disabled = false;
  else
    but.disabled = true;
}





















function test_export_social_net(){
  const nsIFilePicker = Components.interfaces.nsIFilePicker;

  var fp = Components.classes["@mozilla.org/filepicker;1"]
                   .createInstance(nsIFilePicker);
  fp.init(window, "Export Social Network as", nsIFilePicker.modeSave);
  fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

  var rv = fp.show();
  if (rv == nsIFilePicker.returnOK)
  {
    var file = fp.file;
    // Get the path as string. Note that you usually won't
    // need to work with the string paths.
    var path = fp.file.path;
    // work with returned nsILocalFile...

    //now we read the social network and write it to the new file
    var social_net_data=readExtFile("temp_social_net.rdf");
    //now we write the file
    var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                         .createInstance(Components.interfaces.nsIFileOutputStream);

    // use 0x02 | 0x10 to open file for appending.
    foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0); // write, create, truncate
    foStream.write(social_net_data, social_net_data.length);
    foStream.close();
  }

}

function test_restore_social_net(){
const nsIFilePicker = Components.interfaces.nsIFilePicker;

  var fp = Components.classes["@mozilla.org/filepicker;1"]
	           .createInstance(nsIFilePicker);
  fp.init(window, "Restore Social Network from", nsIFilePicker.modeOpen);
  fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

  var rv = fp.show();
  if (rv == nsIFilePicker.returnOK)
  {
    var file = fp.file;
    // Get the path as string. Note that you usually won't 
    // need to work with the string paths.
    var path = fp.file.path;
    // work with returned nsILocalFile...
    //now we read date from the file
    var indata=readFile(path);
    writeExtFile("temp_social_net.rdf",indata);
    window.opener.window.opener.document.getElementById("persona_menu").builder.refresh();

    refresh_social_net();

  }

}



function add_persona_state_change(){
	
	
}


function erase_persona_force_checkbox()
{
	alert("came here");
}
function send_current_id_xml(){
	var persona_id=window.opener.document.getElementById("persona_menu").value;
	alert(" id="+persona_id);
	if(persona_id.length<=0){
		alert("no persona selected");
		return;
	}
	send_xml_file(""+persona_id);
	
}

function test_send_xml_file(){
	send_xml_file("0");
}


function send_xml_file(persona_id, /* optional */ onSuccess){
  //	alert("sending file");
        var time1 = new Date();

	persona_id=persona_id.split(':').join("");
	var filedata=readExtFile(persona_id+".xml");
	
        var time2 = new Date();

	var http_request = false;
	http_request = new XMLHttpRequest();
	if (!http_request) {
		alert('Cannot create XMLHTTP instance');
		return false;
	}
	var user_authinfo=id_to_authinfo(persona_id);
	//var auth_data=hex_md5(filedata);//hex_hmac_md5(auth_info, filedata);
        //var auth_data=hex_hmac_md5(user_authinfo, filedata);
        var auth_data=hex_hmac_sha1(user_authinfo, filedata);


        var time3 = new Date();

	// prepare the MIME POST data
	var boundaryString = '--99384938493';
	var boundary = '--' + boundaryString;
	var requestbody = boundary + '\r\n' 
	+ 'Content-Disposition: form-data; name="com"' + '\r\n' 
	+ '\r\n' 
	+ "update_ratings" + '\r\n' 
	+ boundary + '\r\n' 
	+ 'Content-Disposition: form-data; name="email_address"' + '\r\n' 
	+ '\r\n' 
	+ "0000" + '\r\n' 
	+ boundary + '\r\n' 
	+ 'Content-Disposition: form-data; name="id"' + '\r\n' 
	+ '\r\n' 
	+ make_hex_to_quat_dotted_hex(persona_id) + '\r\n' 
	+ boundary + '\r\n' 
	+ 'Content-Disposition: form-data; name="auth_info"' + '\r\n' 
	+ '\r\n' 
	+ auth_data + '\r\n' 
	+ boundary + '\r\n' 
    + 'Content-Disposition: form-data; name="photo"; filename="' 
		+ "0.xml" + '"' + '\r\n' 
	+ 'Content-Type: application/octet-stream' + '\r\n' 
	+ '\r\n'
	//+ escape(binary.readBytes(binary.available()))
	+ filedata
	+ '\r\n'
	+ boundary + '\r\n' 
	+ 'Content-Disposition: form-data; name="Submit"' + '\r\n' 
	+ '\r\n' 
	+ "Submit Form" + '\r\n'
	+ boundary + "--" + '\r\n';

		
	//document.getElementById('sizespan').innerHTML = 
	//	"requestbody.length=" + requestbody.length;
	
	// do the AJAX request
	//http_request.onreadystatechange = requestdone;
	//http_request.open('POST', "http://156.56.105.13/perl/upload.pl", false);
	http_request.open('POST', dest_url, true);
	http_request.setRequestHeader("Content-type", "multipart/form-data; \
		boundary=\"" + boundaryString + "\"");
	http_request.setRequestHeader("Connection", "close");
	http_request.setRequestHeader("Content-length", requestbody.length);

	//The request handler is placed here for async calls-- weird..
	// but lets keep this with less globals as possible
	http_request.onreadystatechange = function (aEvt) {
            if (http_request.readyState == 4) {
	        //now we start to decode...
                if(200 == http_request.status ){
		  //    	        alert("got a response");
                }
                else{
    	            alert("error" +http_request.status + ":" + http_request.statusText);
    	            return;
                }
                //var doc=xmlhttp.responseXML;
                var doc=http_request.responseText;
                if (null == doc){
    	            alert("error: docuemnt received is not a valid XML file");
                }
                //alert("rvalue ="+doc);

		// Execute optional onSuccess() cleanup
		if (onSuccess) 
		  onSuccess(filedata);
            }
    };
    //now we actually send
    
    var time4 = new Date();
    var diff = new Array(4);
    diff[0]=time2-time1;
    diff[1]=time3-time2;
    diff[2]=time4-time3;
    diff[3]=time4-time1;

    http_request.send(requestbody);
		//alert("file sent? "+diff);
    return;
	
}

function add_persona(){
	//this is a three step process:
	//1. Verify input fields for the user
	//   1.a Check the fields are filled
	//   1.b Check on the local db if this will repeat a nym
	//2. Send the server a proposal
	//3. it proposal is OK add new user to the local database.
	
	//alert("add persona function!");
	refresh_social_net();
	
	var input_nym=document.getElementById("new-persona-nym").value;
	var input_email=document.getElementById("new-persona-email").value;
	
	if(0 == input_email.length || 0==input_nym.length){
		alert("Sorry, you need both a nym and email address to add a new persona");
		return;
		}
	//alert("WtF: in_nym="+input_nym +" in_email="+input_email);
	
	//-------------------	
	//check if there is already such a nym in the local db
	
	//get the extension's file directory, by using the extension id.
	
	//open the social net container..
    var social_net = rdfService.GetResource("http://www.nettrust-site.net/social_net");

    var container = Components.classes["@mozilla.org/rdf/container;1"].
                  createInstance(Components.interfaces.nsIRDFContainer);
    try {
      container.Init(personaWin.tempDS, social_net);
    }
    catch (ex){
    	alert("Cannot initialize container");
       }
       
    var rdf_nym_res = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");   
       
	var stored_personas = container.GetElements();
	var stored_nym;
	while (stored_personas.hasMoreElements()){
    var child = stored_personas.getNext();
       if (child instanceof Components.interfaces.nsIRDFResource){
          //photosDS.Assert(child, ratingProp, threeProp, true);
       	  //do something here
          var target = personaWin.tempDS.GetTarget(child, rdf_nym_res, true);
          if (target instanceof Components.interfaces.nsIRDFLiteral){
             stored_nym = target.Value;
             //alert("Got nym: "+stored_nym);
             if(stored_nym == input_nym){
               alert("Sorry, you alrady have such a nym");
               return;
             }
           }
          
       }
    }
	//---------------
    // Now, we know the input values AND the nym is not present
	//now we can try to connect to the server!
    
    //var dest_url="http://156.56.105.13/perl/nettrust.pl";

    //holy macarrel.. javacscript's random is of size 53 bits..
    // Looks like all math is done in doubles
    // but how random is the random? how much entropy has this
    // random function? 
    var blinding=Math.random()*281474976710656*32;
    var new_user_id=hex_md5(blinding.toString(16)+input_nym+input_email);
    //new_user_id=5;
    //and truncate
    //alert("new_id="+new_user_id);
    new_user_id=new_user_id.slice(16,32);
    new_user_id=make_hex_to_quat_dotted_hex(new_user_id);
    var auth_info=Math.random()*281474976710656*32;
    var auth_info=hex_md5(auth_info.toString(16));
    var user_id_asdecstring=new_user_id.toString(10);
    //return;
    
    var request_data="com=add_user&id="+new_user_id+"&auth_info="+auth_info;
    //var user_id_ashex_len=new_user_id.toString(16).length();
    //alert("adding persona id="+new_user_id + " request="+request_data);
    //alert(user_id_asdec_len + " "+user_id_ashex_len );
    xmlhttp=new XMLHttpRequest();
    xmlhttp.open("POST",dest_url,false);
    xmlhttp.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
    xmlhttp.send(request_data);
    //now we start to decode...
    if(200 == xmlhttp.status ){
    	//alert("got a response");
    }
    else{
    	alert("error" +xmlhttp.status + ":" + xmlhttp.statusText);
    	return;
    }
    var doc=xmlhttp.responseXML;
    if (null == doc){
    	alert("error: docuemnt received is not a valid XML file");
    }
    var rusr=doc.getElementsByTagName("user");
    //var rid=doc.getElementsByTagName("id");
    //alert("user_len="+rusr.length+ " con[0]="+rusr[0]);
    var rid=rusr[0].getAttribute("id");
    var rsalt=rusr[0].getAttribute("salt");
    var rhash=rusr[0].getAttribute("hash");
    //alert("user_id="+rid+" salt="+rsalt+" rhash="+rhash);
    if(null == rid || null == rsalt || null==rhash){
    	alert("Bad server response, try again");
    	return;
    }
    //test for return... values.
    var rtest=rsalt+hex_md5(auth_info);
    var rtest2=hex_md5(rtest);
    //alert("remote="+rhash +" local="+rtest2);
    if(rtest2!=rhash){
    	alert(" not equal remote="+rhash +" local="+rtest2);
    	return;
    }
    //alert("Equal remote="+rhash +" local="+rtest2);
    
    //----
    // Now to step 3:  Add it to the local rdf file..
    // two step.. prepare params.. then insert!
    var local_id=make_hex_to_quat_dotted_hex(rhash);
    var new_user_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/user/"+rid);
    var new_user_nym_literal=rdfService.GetLiteral(""+input_nym);
    var new_user_id_literal=rdfService.GetLiteral(""+rid);
    var new_user_blinder_literal=rdfService.GetLiteral(""+blinding);  
    var new_user_email_literal=rdfService.GetLiteral(""+input_email);
    var new_user_auth_info_literal=rdfService.GetLiteral(""+auth_info);   
    var type_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#type");
    var id_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
    var blinder_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#blinder");
    var email_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#email");
    var auth_info_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#authinfo");       
    var persona_literal=rdfService.GetLiteral("persona");
    //var container_literal=rdfService.GetLiteral("http://www.w3.org/1999/02/22-rdf-syntax-ns#Seq");
    //var container_resource = 
    //    rdfService.GetResource("http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
    //var child_container = Components.classes["@mozilla.org/rdf/container;1"].
    //              createInstance(Components.interfaces.nsIRDFContainer);  
    var rdfContainerUtils = Components.classes["@mozilla.org/rdf/container-utils;1"].
                          getService(Components.interfaces.nsIRDFContainerUtils);
                  
    //and add..
    container.AppendElement(new_user_resource);
    personaWin.tempDS.Assert(new_user_resource,rdf_nym_res,new_user_nym_literal,true);
    personaWin.tempDS.Assert(new_user_resource,id_resource,new_user_id_literal,true);
    personaWin.tempDS.Assert(new_user_resource,type_resource,persona_literal,true);
    personaWin.tempDS.Assert(new_user_resource,email_resource,new_user_email_literal,true);
    personaWin.tempDS.Assert(new_user_resource,blinder_resource,new_user_blinder_literal,true);
    personaWin.tempDS.Assert(new_user_resource,auth_info_resource,new_user_auth_info_literal,true);
    //personaWin.tempDS.Assert(new_user_resource,container_resource,container_literal,true);
    //child_container.Init(personaWin.tempDS, new_user_resource);
    var child_container = rdfContainerUtils.MakeSeq(personaWin.tempDS, new_user_resource);
    
    //alert success-remove later?
    alert("New User added sucessfully!");
    //clean up values.
    document.getElementById("new-persona-nym").value="";
    document.getElementById("new-persona-email").value="";

    refresh_social_net();
	
    load_persona_menu();
		
}



function erase_persona_forced(){
	//get data..
	// iterate over friends, delete each connection
	// remove all values from the persona..
	//alert("came here");
	var persona_id = document.getElementById("persona_list").selectedItem.value;
	alert("forced erase '" + persona_id + "'");
	
	
    //define the user resource
    var persona_resource=rdfService.GetResource("http://www.nettrust-site.net/user/"+persona_id);
    
	//open the user friends container..
    var friends_net = rdfService.GetResource("http://www.nettrust-site.net/user/"+persona_id);

    var friends_container = Components.classes["@mozilla.org/rdf/container;1"].
                  createInstance(Components.interfaces.nsIRDFContainer);
    try {
      friends_container.Init(personaWin.tempDS, friends_net);
      //now iterate over the container... and remove the children
      var children = friends_container.GetElements();
      while (children.hasMoreElements()){
          var child = children.getNext();
          if (child instanceof Components.interfaces.nsIRDFResource){
             //photosDS.Assert(child, ratingProp, threeProp, true);
          	 friends_container.RemoveElement(child,true);
          }
      }
      
      
    }
    catch (ex){
      // alert("Cannot initialize container: no friends?");
       }
       
    //-------------------------------------------
	//finally erase the persona..
    // remove it from the social net
	var social_net = rdfService.GetResource("http://www.nettrust-site.net/social_net");

    var container = Components.classes["@mozilla.org/rdf/container;1"].
                  createInstance(Components.interfaces.nsIRDFContainer);
    try {
      container.Init(personaWin.tempDS, social_net);
      container.RemoveElement(persona_resource,true);
    }
    catch (ex){
    	alert("Cannot initialize social netcontainer");
       }
    
    // now remove all the literals...
    var nym_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");
    var type_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#type");
    var id_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
    var blinder_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#blinder");
    var email_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#email");
    var auth_info_resource = 
        rdfService.GetResource("http://www.nettrust-site.net/rdf#authinfo");
 
    var target = personaWin.tempDS.GetTarget(persona_resource, type_resource, true);
    personaWin.tempDS.Unassert(persona_resource, type_resource, target);
    target = personaWin.tempDS.GetTarget(persona_resource, nym_resource, true);
    personaWin.tempDS.Unassert(persona_resource, nym_resource, target);
    target = personaWin.tempDS.GetTarget(persona_resource, id_resource, true);
    personaWin.tempDS.Unassert(persona_resource, id_resource, target);
    target = personaWin.tempDS.GetTarget(persona_resource, email_resource, true);
    personaWin.tempDS.Unassert(persona_resource, email_resource, target);
    target = personaWin.tempDS.GetTarget(persona_resource, auth_info_resource, true);
    personaWin.tempDS.Unassert(persona_resource, auth_info_resource, target);   
    target = personaWin.tempDS.GetTarget(persona_resource, blinder_resource, true);
    personaWin.tempDS.Unassert(persona_resource, blinder_resource, target);      

    refresh_social_net();  

	//alert("came here 3");
		document.getElementById("per_fri").value = "";
		document.getElementById("persona_nym").value = "";
		document.getElementById("persona_netid").value = "";
		document.getElementById("persona_email").value = "";
		document.getElementById("persona_type").value = "";
    
}

function erase_persona_menu(persona_id){
        refresh_social_net();
	var erase_button=document.getElementById("erase_persona_button");
	var erase_forced_checkbox=document.getElementById("persona_erase_forced_checkbox");
	if(!(persona_id)){
		alert("no persona");
		erase_button.setAttribute("disabled","true");
		erase_forced_checkbox.setAttribute("disabled","true");
		
		return;
	}
    erase_button.setAttribute("disabled","false");
    erase_forced_checkbox.setAttribute("disabled","false");
	//if persona has connections enable the 
	//force checkbox else enable the erase
	alert(""+persona_id);	
}


/*  
    This code is modified by Praveen
    This code adds and deletes a friend
*/

function load_persona_menu() {
  //	alert("load_persona_menu() on personaWin.tempDS");
	
  var count =document.getElementById('persona_list').getRowCount();
  //alert(count);
  //var delele;
  for(var p = 0; p< count ; p++)
    {
      //alert("p value"+p);
      document.getElementById('persona_list').removeItemAt(0);
      //alert("element deleted "+delele.label);
    }
	
  var folderRes = rdfService.GetResource("http://www.nettrust-site.net/social_net");
  var nym = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");
  var netid = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
  var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
  try {
    container.Init(personaWin.tempDS, folderRes);
  }
  catch (ex){alert("problem here");}
  var net_id;
  var name_nym;
  var children = container.GetElements();
  while (children.hasMoreElements()){
			  
    var child = children.getNext();
    if (child instanceof Components.interfaces.nsIRDFResource){
				 
      var target = personaWin.tempDS.GetTarget(child, nym, true);
      if (target instanceof Components.interfaces.nsIRDFLiteral){
	name_nym = target.Value;
	//alert(name_nym);
      }
      var target1= personaWin.tempDS.GetTarget(child, netid, true);
      if (target1 instanceof Components.interfaces.nsIRDFLiteral){
	net_id = target1.Value;
	//alert(net_id);
      }
      document.getElementById('persona_list').appendItem(name_nym, net_id);
      //list[num] = name_nym;
      //num++;
    }
  }

}

function load_friend_menu()
{
	
  var count =document.getElementById('friends_list').getRowCount();
  //alert(count);
  //var delele;
  for(var p = 0; p< count ; p++)
    {
      //alert("p value"+p);
      document.getElementById('friends_list').removeItemAt(0);
      //alert("element deleted "+delele.label);
    }
	
  var folderRes = rdfService.GetResource("http://www.nettrust-site.net/friends");
  var nym = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");
  var netid = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
  var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
  try {
    container.Init(personaWin.tempDS, folderRes);
  }
  catch (ex){alert("problem here");}
  var net_id;
  var name_nym;
  var children = container.GetElements();
  while (children.hasMoreElements()){
			  
    var child = children.getNext();
    if (child instanceof Components.interfaces.nsIRDFResource){
				 
      var target = personaWin.tempDS.GetTarget(child, nym, true);
      if (target instanceof Components.interfaces.nsIRDFLiteral){
	name_nym = target.Value;
	//alert(name_nym);
      }
      var target1= personaWin.tempDS.GetTarget(child, netid, true);
      if (target1 instanceof Components.interfaces.nsIRDFLiteral){
	net_id = target1.Value;
	//alert(net_id);
      }
      document.getElementById('friends_list').appendItem(name_nym, net_id);
      //list[num] = name_nym;
      //num++;
    }
  }
}

function show_friends_details() {
  //alert("came to this");
  var nym = document.getElementById("friends_list").selectedItem.label;
  var netid = document.getElementById("friends_list").selectedItem.value;
  //var friend=document.getElementById("friend_details");
  //friend.setAttribute("hidden","false");
  //alert(nym);

  //alert("came here also");
  document.getElementById("friend_nym").value = nym;
		
		
  //alert(netid);
  document.getElementById("friend_netid").value = netid;
		
  var res = "http://www.nettrust-site.net/user/"+netid;



  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#email");
	
  var fid = rdfService.GetLiteral(netid);
	
  var subject = rdfService.GetResource(res);

  // checking if the netid already exists. If it already exists it will not be saved again
  var target = personaWin.tempDS.GetTarget(subject,predicate , true);

  if (target instanceof Components.interfaces.nsIRDFLiteral){
    document.getElementById("friend_email").value = target.Value;
		
  }
		
  predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#type");
  target = personaWin.tempDS.GetTarget(subject,predicate , true);

  if (target instanceof Components.interfaces.nsIRDFLiteral){
    document.getElementById("friend_type").value = target.Value;
		
  }
		
		
		
  var folderRes = rdfService.GetResource("http://www.nettrust-site.net/social_net");

  var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
  try {
    container.Init(personaWin.tempDS, folderRes);
  }
  catch (ex){alert("problem here");}
  //var nym_id = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
			
  var children = container.GetElements();
			
  var name_nym;
  var per_list = "";
  //var list= new Array(25);
  //var num =0;
  //alert("came here also1");
  //alert("came here");
  var list_name="";
  var list_per="";
  var per_list ="";
  var list_name="" ;
  var per1_list = "";
  var target = "";
  var target1 = "";
  var container1 = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
					
  var name = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
  var name1 = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");
  while (children.hasMoreElements()){
    //alert(nym);
			  
    var child = children.getNext();
    if (child instanceof Components.interfaces.nsIRDFResource)
      {
			  		
	try {
	  container1.Init(personaWin.tempDS, child);
	}
	catch (ex){alert("problem here");}
	var list = container1.GetElements();
					
	while(list.hasMoreElements())
	  {
	    //alert(netid);
						
	    var list_child = list.getNext();	
	    if (list_child instanceof Components.interfaces.nsIRDFResource)
	      {
		//alert(nym);
							
		target = personaWin.tempDS.GetTarget(list_child,name, true );

		if (target instanceof Components.interfaces.nsIRDFLiteral)
		  {
		    list_name = target.Value;
		    //alert(list_name);
		    if(list_name== netid)
		      {
			//alert("equal"+netid);
			target1 = personaWin.tempDS.GetTarget(child,name1, true );

			if (target1 instanceof Components.interfaces.nsIRDFLiteral)
			  {
			    list_per = target1.Value;
			    if(per_list != "")
			      {
				per_list = per_list + " , ";	
			      }
										
			    per_list = per_list + list_per;
			    //alert("this is the list"+list_per);
			    break;
			  }
		      }
		  }
	      }
	  }
      }
				
			 
  }
  if(per_list == "")
    {
      per_list = "None";
    }else
    {
      per_list = per_list+".";
    }
  document.getElementById("fri_per").value = per_list;
		
  //alert("came here also");
	
}

function manage_Persona()
{
		
	var persona=document.getElementById("manage_persona");
		persona.setAttribute("hidden","false");
		var friend=document.getElementById("manage_friend");
		friend.setAttribute("hidden","true");
	
}

function show_persona_details() {
  //alert("show details");
  var nym = document.getElementById("persona_list").selectedItem.label;
  var netid = document.getElementById("persona_list").selectedItem.value;
  //var friend=document.getElementById("persona_details");
  //friend.setAttribute("hidden","false");
		

  //alert("came here also");
  document.getElementById("persona_nym").value = nym;
		
		
  //alert(netid);
  document.getElementById("persona_netid").value = netid;
		
  var res = "http://www.nettrust-site.net/user/"+netid;



  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#email");
	
  var fid = rdfService.GetLiteral(netid);
	
  var subject = rdfService.GetResource(res);

  // checking if the netid already exists. If it already exists it will not be saved again
  var target = personaWin.tempDS.GetTarget(subject,predicate , true);

  if (target instanceof Components.interfaces.nsIRDFLiteral){
    document.getElementById("persona_email").value = target.Value;
		
  }
		
  predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#type");
  target = personaWin.tempDS.GetTarget(subject,predicate , true);

  if (target instanceof Components.interfaces.nsIRDFLiteral){
    document.getElementById("persona_type").value = target.Value;
		
  }
  //alert("came here also");
	
  var folderRes = rdfService.GetResource("http://www.nettrust-site.net/user/"+netid);

  var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
  try {
    container.Init(personaWin.tempDS, folderRes);
  }
  catch (ex){alert("problem here");}
  var nym_id = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
  var name = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");
  var children = container.GetElements();
			
  var name_nym;
  var friends_list = "";
  //var list= new Array(25);
  //var num =0;
  //alert("came here also");
  while (children.hasMoreElements()){
			  
    var child = children.getNext();
    if(friends_list != "")
      {
	friends_list = friends_list+" , ";
      }
    if (child instanceof Components.interfaces.nsIRDFResource){
				 
      var target1= personaWin.tempDS.GetTarget(child, name, true);
      if (target1 instanceof Components.interfaces.nsIRDFLiteral){
	name_nym = target1.Value;
	//alert(name_nym);
      }
      //document.getElementById('Persona_flist').appendItem(name_nym, netID);
      friends_list = friends_list + name_nym ;
				 
    }
  }
  if(friends_list == "")
    {
      friends_list = "None";
    }else
    {
      friends_list = friends_list+".";
    }
  document.getElementById("per_fri").value = friends_list;
  //alert("came here");
			
	
}
function show_details1() {

  var selection = document.getElementById("friend_list").selectedItem;
  
  if (!selection) {
    document.getElementById("nym1").value = "";
    document.getElementById("netid1").value = "";
    document.getElementById("email1").value = "";
    document.getElementById("type1").value = "";
  }
  
  var nym = selection.label;
  var netid = selection.value;

  document.getElementById("nym1").value = nym;
  document.getElementById("netid1").value = netid;
		
  var res = "http://www.nettrust-site.net/user/"+netid;
  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#email");
  var fid = rdfService.GetLiteral(netid);
  var subject = rdfService.GetResource(res);

  // checking if the netid already exists. If it already exists it will not be saved again
  var target = personaWin.tempDS.GetTarget(subject,predicate , true);

  if (target instanceof Components.interfaces.nsIRDFLiteral){
    document.getElementById("email1").value = target.Value;
  }
		
  predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#type");
  target = personaWin.tempDS.GetTarget(subject,predicate , true);

  if (target instanceof Components.interfaces.nsIRDFLiteral){
    document.getElementById("type1").value = target.Value;
  }
}

function show_details2() {
  var selection = document.getElementById("Persona_flist").selectedItem;
  
  if (!selection) {
    document.getElementById("nym1").value = "";
    document.getElementById("netid1").value = "";
    document.getElementById("email1").value = "";
    document.getElementById("type1").value = "";
  }
  
  var nym = selection.label;
  var netid = selection.value;

  document.getElementById("nym1").value = nym;
  document.getElementById("netid1").value = netid;
		
  var res = "http://www.nettrust-site.net/user/"+netid;
  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#email");
  var fid = rdfService.GetLiteral(netid);
  var subject = rdfService.GetResource(res);

  // checking if the netid already exists. If it already exists it will not be saved again
  var target = personaWin.tempDS.GetTarget(subject,predicate , true);

  if (target instanceof Components.interfaces.nsIRDFLiteral){
    document.getElementById("email1").value = target.Value;
  }
		
  predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#type");
  target = personaWin.tempDS.GetTarget(subject,predicate , true);

  if (target instanceof Components.interfaces.nsIRDFLiteral){
    document.getElementById("type1").value = target.Value;
  }
}

function populating_lists(){
	
  var persona = document.getElementById("persona_menu").label;
  if(persona != "None") {
      document.getElementById("friend_label").value ="Friends of "+ persona;
    } else {
      document.getElementById("friend_label").value ="Friends";
    }

  var persona_id = document.getElementById("persona_menu").value;
  var count =document.getElementById('friend_list').getRowCount();

  for(var p = 0; p< count ; p++) {
      //alert("p value"+p);
      document.getElementById('friend_list').removeItemAt(0);
      //alert("element deleted "+delele.label);
    }
	
  count =document.getElementById('Persona_flist').getRowCount();

  for(p = 0; p< count ; p++) {
      //alert("p value"+p);
      document.getElementById('Persona_flist').removeItemAt(0);
      //alert("element deleted "+delele.label);
    }
	
  if(persona == "None") {
      return 0;
    }

  var folderRes = rdfService.GetResource("http://www.nettrust-site.net/user/"+persona_id);
  var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);

  try {
    container.Init(personaWin.tempDS, folderRes);
  }
  catch (ex){alert("problem here");}

  var nym_id = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
  var name = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");
  var children = container.GetElements();
  var netID;
  var name_nym;
  var list= new Array(25);
  var num =0;

  while (children.hasMoreElements()){
    var child = children.getNext();
    if (child instanceof Components.interfaces.nsIRDFResource) {
      var target = personaWin.tempDS.GetTarget(child, nym_id, true);
      if (target instanceof Components.interfaces.nsIRDFLiteral){
	netID = target.Value;
	//alert(netID);
      }
      var target1= personaWin.tempDS.GetTarget(child, name, true);
      if (target1 instanceof Components.interfaces.nsIRDFLiteral) {
	name_nym = target1.Value;
	//alert(name_nym);
      }
      document.getElementById('Persona_flist').appendItem(name_nym, netID);
      list[num] = name_nym;
      num++;
    }
  }
  var fname;
  var fid;
  res = rdfService.GetResource("http://www.nettrust-site.net/friends");
  var container1 = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
  try {
    container1.Init(personaWin.tempDS, res);
  }
  catch (ex){alert("exception 1");}
  //var count = container.GetCount();
  //alert(count);
  var children1 = container1.GetElements();
  while (children1.hasMoreElements()){
    var child1 = children1.getNext();
    //alert("came here 2");
    if (child1 instanceof Components.interfaces.nsIRDFResource){
		
      var target2 = personaWin.tempDS.GetTarget(child1, nym_id, true);
      if (target2 instanceof Components.interfaces.nsIRDFLiteral){
	fid = target2.Value;
	//alert(fid);
      }
      var target3= personaWin.tempDS.GetTarget(child1, name, true);
      if (target3 instanceof Components.interfaces.nsIRDFLiteral){
	fname = target3.Value;
	//alert(fname);
      }
      var present = 0;
      for(var i=0; i<num; i++)
	{
	  if(list[i] == fname)
	    {
	      //alert("fname"+ fname+" is equal to fname"+list[i]);
	      present = 1;
	    }
	}
      if(present ==0)
	document.getElementById('friend_list').appendItem(fname, fid);
				 
    }
  } 
}

function cancel()
{
	
	var persona=document.getElementById("manage_persona");
		persona.setAttribute("hidden","true");
		var friend=document.getElementById("manage_friend");
		friend.setAttribute("hidden","true");
}


function open_addfriend()
{
		//alert("camehere");
		var persona=document.getElementById("manage_persona");
		persona.setAttribute("hidden","true");
		var friend=document.getElementById("manage_friend");
		friend.setAttribute("hidden","false");
		//var friend = document.getElementById("frie");
		//friend.serAttribute("hidden","true");
}
function add_friend() {
  // getting the values from the document
  var nym = document.getElementById("new-friend-nym").value;
  var email = document.getElementById("new-friend-email").value;
  var netid = document.getElementById("new-friend-id").value;
  var blinder = document.getElementById("new-friend-blinder").value;
	
  if( nym=="" || email=="" || netid=="" || blinder=="" ) {
      alert("Please fill all the feilds");
      return 0;
    }
	
  var chk_email = validate_email(email);
  if(chk_email == 0)
    {
      alert("enter valid email id");
      return 0;
    }

  var chk_netid = validate_netid(netid);
  if(chk_netid == 0)
    {
      alert("enter valid netid");
      return 0;
    }	

  var val_blind = validate_blinder(blinder);
	
  if( val_blind == 0)
    {
      alert("enter the correct blinder");
      return 0;	
    }

  var res = "http://www.nettrust-site.net/user/"+netid;



  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
	
  var fid = rdfService.GetLiteral(netid);
	
  var subject = rdfService.GetResource(res);

  // checking if the netid already exists. If it already exists it will not be saved again
  var target = personaWin.tempDS.GetSource(predicate, fid , true);

  if (target instanceof Components.interfaces.nsIRDFResource){
    alert("Already added");
    return 0;
  }

  // if the net id does not exist all the data will be saved in the database.
	

  personaWin.tempDS.Assert(subject, predicate, fid , true);

	
  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");
  var fnym = rdfService.GetLiteral(nym);
  personaWin.tempDS.Assert(subject, predicate, fnym, true);


  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#email");
  var femail = rdfService.GetLiteral(email);
  personaWin.tempDS.Assert(subject, predicate,femail , true);
	



  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
  var fid = rdfService.GetLiteral(netid);
  personaWin.tempDS.Assert(subject, predicate, fid , true);	
	

	
  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#type");
  var friend = rdfService.GetLiteral("friend");
  personaWin.tempDS.Assert(subject, predicate, friend , true);	

  subject = rdfService.GetResource("http://www.nettrust-site.net/friends");
  var rdf = rdfService.GetResource(res);
	
  //new friend is added here
  var rdfContainerUtils = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
	
	
  try {
    rdfContainerUtils.Init(personaWin.tempDS, subject);
    rdfContainerUtils.AppendElement(rdf);
  }
  catch (ex){alert("Error In adding as a Friend");}

  // all the text in the text boxes is cleared.
	
  document.getElementById("new-friend-nym").value = "";
	
  document.getElementById("new-friend-email").value = "";
	
  document.getElementById("new-friend-id").value = "";
	
  document.getElementById("new-friend-blinder").value = "";
  //	alert("successfully added");

  refresh_social_net();

		
    	
}


function add_validated_friend (netid, nym, blinder, email) {
  var res = "http://www.nettrust-site.net/user/"+netid;
  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
  var fid = rdfService.GetLiteral(netid);
  var subject = rdfService.GetResource(res);

  // checking if the netid already exists. If it already exists it will not be saved again
  var target = personaWin.tempDS.GetSource(predicate, fid , true);

  if (target instanceof Components.interfaces.nsIRDFResource){
    alert("Already added");
    return 0;
  }

  // if the net id does not exist all the data will be saved in the database.
  personaWin.tempDS.Assert(subject, predicate, fid , true);
	
  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");
  var fnym = rdfService.GetLiteral(nym);
  personaWin.tempDS.Assert(subject, predicate, fnym, true);

  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#email");
  var femail = rdfService.GetLiteral(email);
  personaWin.tempDS.Assert(subject, predicate,femail , true);

  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
  var fid = rdfService.GetLiteral(netid);
  personaWin.tempDS.Assert(subject, predicate, fid , true);	

  var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#type");
  var friend = rdfService.GetLiteral("friend");
  personaWin.tempDS.Assert(subject, predicate, friend , true);	

  subject = rdfService.GetResource("http://www.nettrust-site.net/friends");
  var rdf = rdfService.GetResource(res);
	
  //new friend is added here
  var rdfContainerUtils = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
	
  try {
    rdfContainerUtils.Init(personaWin.tempDS, subject);
    rdfContainerUtils.AppendElement(rdf);
  }
  catch (ex){alert("Error In adding as a Friend");}

  // all the text in the text boxes is cleared.
	
  document.getElementById("new-friend-nym").value = "";
  document.getElementById("new-friend-email").value = "";
  document.getElementById("new-friend-id").value = "";
  document.getElementById("new-friend-blinder").value = "";
  refresh_social_net();
}


function delete_friend(){
  //  alert("came here");
  // the value of the nim is collected
  var selection =document.getElementById("friends_list").selectedItem;
  //  alert(nym);

  // check if no friend is selected	
  if(!selection){ alert("Please select a Friend"); return 0;}

  //  var nym = ;
  var nym1 = rdfService.GetLiteral(selection.label);
  var name1 = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");
  var subject= personaWin.tempDS.GetSource(name1, nym1 , true);


  var name = rdfService.GetResource("http://www.nettrust-site.net/rdf#id");

  var netID;

  var target = personaWin.tempDS.GetTarget(subject, name, true);
  if (target instanceof Components.interfaces.nsIRDFLiteral){
    netID = target.Value;
    personaWin.tempDS.Unassert(subject, name, target);
    personaWin.tempDS.Unassert(subject, name1, nym1);


  }
	
  // deleting the friend from the friends list
  var res = "http://www.nettrust-site.net/user/"+netID;
  var rdf = rdfService.GetResource(res);

  var res1 = rdfService.GetResource("http://www.nettrust-site.net/social_net");

  var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
  try {
    container.Init(personaWin.tempDS, res1);
  }
  catch (ex){alert("exception 1");}
  //var count = container.GetCount();
  //alert(count);
  var children = container.GetElements();
  while (children.hasMoreElements()){
    var child = children.getNext();
    //alert(child);
    if (child instanceof Components.interfaces.nsIRDFResource){
		
      var container1 = Components.classes["@mozilla.org/rdf/container;1"].
	createInstance(Components.interfaces.nsIRDFContainer);
      try {
	container1.Init(personaWin.tempDS, child);
	container1.RemoveElement(rdf,true);
      }
      catch (ex){alert("exception2");}	 
    }
  } 



  var rdfContainerUtils = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
	



  subject1 = rdfService.GetResource("http://www.nettrust-site.net/friends");
	
	
  try {
    rdfContainerUtils.Init(personaWin.tempDS, subject1);
		
    rdfContainerUtils.RemoveElement(rdf,true);

  }
  catch (ex){alert("Error In deleting as a Friend");}

	
  // deleting email feild

  name = rdfService.GetResource("http://www.nettrust-site.net/rdf#email");		
  var target = personaWin.tempDS.GetTarget(subject, name, true);
  if (target instanceof Components.interfaces.nsIRDFLiteral){
    personaWin.tempDS.Unassert(subject, name, target);
  }


  // deleting blinder
  name = rdfService.GetResource("http://www.nettrust-site.net/rdf#blinder");		
  var target = personaWin.tempDS.GetTarget(subject, name, true);
  if (target instanceof Components.interfaces.nsIRDFLiteral){
    personaWin.tempDS.Unassert(subject, name, target);
  }
	

  //deleting name
  name = rdfService.GetResource("http://www.nettrust-site.net/rdf#name");		
  var target = personaWin.tempDS.GetTarget(subject, name, true);
  if (target instanceof Components.interfaces.nsIRDFLiteral){
    personaWin.tempDS.Unassert(subject, name, target);
  }
	

  name = rdfService.GetResource("http://www.nettrust-site.net/rdf#type");		
  var target = personaWin.tempDS.GetTarget(subject, name, true);
  if (target instanceof Components.interfaces.nsIRDFLiteral){
    personaWin.tempDS.Unassert(subject, name, target);
  }

  name = rdfService.GetResource("http://www.nettrust-site.net/rdf#enabled");		
  var target = personaWin.tempDS.GetTarget(subject, name, true);
  if (target instanceof Components.interfaces.nsIRDFLiteral){
    personaWin.tempDS.Unassert(subject, name, target);
  }

  document.getElementById("fri_per").value = "";
  document.getElementById("friend_nym").value = "";
  document.getElementById("friend_netid").value = "";
  document.getElementById("friend_email").value = "";
  document.getElementById("friend_type").value = "";

  alert(" Successfully deleted");
  refresh_social_net();
}	




function remove_relationship() {
  //assumes values are valid for addition....
  var persona_id=document.getElementById("persona_menu").value;
  var friend_id=document.getElementById("Persona_flist").selectedItem.value;
	
  //open the social net container..
  var persona_net = rdfService.GetResource("http://www.nettrust-site.net/user/"+persona_id);
  var friend_resource =
    rdfService.GetResource("http://www.nettrust-site.net/user/"+friend_id);
  var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
                  
  //alert("removing");
  try {
    container.Init(personaWin.tempDS, persona_net);          
  }
  catch (ex){
    alert("Cannot initialize container");
    return;
  }
  container.RemoveElement(friend_resource,true);
  refresh_social_net();
}

function add_relationship() {
  //assumes values are valid for addition....
  var persona_id=document.getElementById("persona_menu").value;
  var friend_id=document.getElementById("friend_list").selectedItem.value;
	
  //open the social net container..
  var persona_net = rdfService.GetResource("http://www.nettrust-site.net/user/"+persona_id);
  var friend_resource =
    rdfService.GetResource("http://www.nettrust-site.net/user/"+friend_id);
  var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
	
  //alert("adding");
  try {
    container.Init(personaWin.tempDS, persona_net);          
  }
  catch (ex){
    alert("Cannot initialize container");
    return;
  }
  container.InsertElementAt(friend_resource,1,true);
  refresh_social_net(); 	
}


function validate_email(mail)
{
	var a= mail.indexOf('@');
	var b= mail.indexOf('.');
	var c =mail.length;
		
	if((a>=1) && (b>0) && (a<b) && ((b-a)>=2) && ((c-b)>=3) )
	{
		return 1;
	}

	else
	{
		return 0;
	}
}

function validate_blinder(blind)
{
	var num = blind * 0;
	if(num == 0)
	{
		return 1;
	}
	else
	{
		return 0;
	}
}


function validate_netid(id)
{
	var num;
	if(id.length != 19)
	{
		return 0;
	}
	for(var i =0; i<19 ; i++)
	{
		num = id[i];
		if(((i+1) % 5) == 0)
		{
			if( num != ':')
			{
				//alert("enter a valid netid");
				return 0;
			}
		}else if((num * 0) != 0)
		{
			if( (num != 'a') && (num != 'b') && (num != 'c') && (num != 'd') && (num != 'e') && (num != 'f') )
				{
					//alert("enter a valid netid");
					return 0;
				}
				
		}
		
		
	}
	
	return 1;

}

