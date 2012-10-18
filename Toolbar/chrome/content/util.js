/*
util.js: provides 
utilites for template management,
author: Camilo Viecco, 2007
        Praveen
*/

//--- nasty globals
const id = "{65b3130e-8513-41b6-8ea8-43dbd9cc0bf5}";
const NTHomophilyExp = false;
var dest_url= "http://nettrust0.ucs.indiana.edu/perl/nettrust" + (NTHomophilyExp ? "_exp.pl" : ".pl");
var read_url= "http://nettrust.ucs.indiana.edu/perl/nettrust" + (NTHomophilyExp ? "_exp.pl" : ".pl");

var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"].
                   getService(Components.interfaces.nsIRDFService);
var reload_broadcasters="false";
//var disable_ui="true";
var broadcasterMemoryDS;
var pending_url_val;
var broadcaster_data_resource;




///-------------now functions


function test_proxy_get(){
  var test_url="http://nettrust0.ucs.indiana.edu/perl/nettrust.pl?com=ratings;id=f289:4c3a:8d4f:a65b";
  var text="unmodified";

  //--xml version
  var xmlhttp=new XMLHttpRequest();
  xmlhttp.open("GET",test_url,false);
  xmlhttp.send(null);
  //now we start to decode...
  if(200 == xmlhttp.status ){
    //alert("got a response");
  }
  else{
    alert("error" +xmlhttp.status + ":" + xmlhttp.statusText);
    return getDBLocally();
  }
  //text=xmlhttp.responseText;
  //--end of XML version

  var proxy_service = Components.classes["@mozilla.org/network/protocol-proxy-service;1"].
            getService(Components.interfaces.nsIProtocolProxyService);
  
  //72.36.178.162 http-transparent 80
  //84.108.51.36  socks5           14237
  //dune.rcac.purdue.edu http-anonymous 80   

  var proxy_info=proxy_service.newProxyInfo("http","dune.rcac.purdue.edu",80,0,20,null);


  var http_req = Components.classes["@mozilla.org/network/protocol;1?name=http"].createInstance();
  if (http_req){
      http_req.QueryInterface(Components.interfaces.nsIProxiedProtocolHandler);
      alert("proxified?");
    }
  else{
    alert("nothing_created");
  }
  //var local_uri= http_comp.newURI(test_url,null,null);

  alert("rval="+text);
  

}

function make_hex_to_quat_dotted_hex(input_string){
	// add a Z to end of string.. this is horrible hack
	input_string=input_string+"Z";
	var in_length=input_string.length;
	var out_string="";
	for(var i=0; i<in_length-1; i=i+4){ //minus1 added after+Z
		//out_string=input_string.slice(-i-5,-1-i)+":"+out_string;
		out_string=input_string.slice(-i-5,-1-i)+":"+out_string;
	}
	//out_string=input_string.slice(-5,-1)+","+out_string;
	// now remove the end ':'
	out_string=out_string.slice(0,out_string.length-1);
	//alert("prev="+input_string+" post="+out_string+ "**");
	return out_string;
}

function id_to_name(input_id){
	var id=input_id.split(':').join("");
	if (id == "0000000000000000")
	  return "Private";
	id=make_hex_to_quat_dotted_hex(id);
	var fileDS = rdfService.GetDataSource("chrome://nettrust/content/data/social_net.rdf");
    var name_predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#nym");
	var ident_subject = rdfService.GetResource("http://www.nettrust-site.net/user/"+id);
    var name = fileDS.GetTarget(ident_subject, name_predicate, true);
    if (name instanceof Components.interfaces.nsIRDFLiteral){
    	return name.Value;
    }
    else{
    	return input_id;
    }	
}

function id_to_authinfo(input_id){
	var id=input_id.split(':').join("");
	id=make_hex_to_quat_dotted_hex(id);
	var fileDS = rdfService.GetDataSource("chrome://nettrust/content/data/social_net.rdf");
    var authinfo_predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#authinfo");
	var ident_subject = rdfService.GetResource("http://www.nettrust-site.net/user/"+id);
    var name = fileDS.GetTarget(ident_subject, authinfo_predicate, true);
    if (name instanceof Components.interfaces.nsIRDFLiteral){
    	return name.Value;
    }
    else{
    	return input_id;
    }	
}

function disable_peer_buttons(){
    var friends = document.getElementById("lfriends");
    friends.setAttribute("disabled", "true"); 
    var friends_tb = document.getElementById("friends");
    friends_tb.setAttribute("disabled", "true");
    var rate_label = document.getElementById("rate_site_label");
    rate_label.setAttribute("disabled","true");
    var thumbdown = document.getElementById("thumbdown");
    thumbdown.setAttribute("disabled","true");
    var thumbup = document.getElementById("thumbup");
    thumbup.setAttribute("disabled","true");     
    var rank_label = document.getElementById("rank_label");
    rank_label.setAttribute("disabled","true");
    var comments_label = document.getElementById("comments");
    comments_label.setAttribute("disabled","true");
    comments_label.setAttribute("label","Comments: 0"); 
}
function enable_peer_buttons(){
    var friends = document.getElementById("lfriends");
    friends.setAttribute("disabled", "false"); 
    var friends_tb = document.getElementById("friends");
    friends_tb.setAttribute("disabled", "false");
    var rate_label = document.getElementById("rate_site_label");
    rate_label.setAttribute("disabled","false");
    var thumbdown = document.getElementById("thumbdown");
    thumbdown.setAttribute("disabled","false");
    var thumbup = document.getElementById("thumbup");
    thumbup.setAttribute("disabled","false");     
    var rank_label = document.getElementById("rank_label");
    rank_label.setAttribute("disabled","false");
    var comments_label = document.getElementById("comments");
    comments_label.setAttribute("disabled","false");
}


//This function gets a persona in colon serparated format and applies the 
// appropiate filters
// This is called when the user changes the persona in the main window!
function applyPersonaFilter(persona_id){

  do_process(document.getElementById("urlbar").value);
  //  alert("Switched to " + persona_id);
  //little bit broken
//   var button=document.getElementById("persona_button");
//   //open the persona container and query its size..
//   if(persona_id){
//     var fileDS = rdfService.GetDataSource("chrome://nettrust/content/data/social_net.rdf");
//     var persona_resource=rdfService.GetResource("http://www.nettrust-site.net/user/"+persona_id);
//     var container = Components.classes["@mozilla.org/rdf/container;1"].
//       createInstance(Components.interfaces.nsIRDFContainer);
//     var id_resource = 
//       rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
//     var arr = new Array();   
//     var i=0;
//     try{              
//       container.Init(fileDS, persona_resource);
//       //get count is problemmatic, but will ignore this for now
//       var childcount=container.GetCount();
//       //var arr = new Array(childcount);

//       var children = container.GetElements();
//       while (children.hasMoreElements()){
//         var child = children.getNext();
// 	if (child instanceof Components.interfaces.nsIRDFResource){
//           // photosDS.Assert(child, ratingProp, threeProp, true);
// 	  //get id
// 	  var target = fileDS.GetTarget(child, id_resource, true);
// 	  if (target instanceof Components.interfaces.nsIRDFLiteral){
// 	    //karensname = target.Value;
// 	    //alert("child="+child.Value+" target="+target.Value);
// 	    arr[i]=target.Value.split(':').join("");
// 	    i=i+1;
// 	  }
// 	  else{
// 	    //maybe a broadcaster.. need to check to avoid extra noise
// 	    // will silent the alert for now!
// 	    //alert(" did not get literal! child="+child.Value+"res="+id_resource.Value);
// 	  }

// 	}
//       }   
      
//     }
//     catch (ex){
//       alert("Cannot initialize container: no friends?");
//       // Set everyone else to "None" and save db.
//     }


//     // This only has to happen once.
//     persona_change(persona_id.split(':').join(""),arr );
//     // For updating persona_menu in other windows
//   }
//   var menuInd = document.getElementById("persona_menu").selectedIndex; 
	  
//   // Now update display for all windows
//   var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
//     .getService(Components.interfaces.nsIWindowMediator);
//   var enumerator = wm.getEnumerator("navigator:browser");
//   while(enumerator.hasMoreElements()) {
//     var win = enumerator.getNext();
	    
//     // confirm that other windows are running NT
//     if (win.NTSharedState) {
//       win.document.getElementById("persona_menu").selectedIndex = menuInd;
//       if (persona_id.length > 0) {
// 	win.document.getElementById("persona_button").setAttribute("image", "chrome://nettrust/skin/connect.png");
// 	win.enable_peer_buttons();
// 	win.do_process(win.document.getElementById("urlbar").value);
//       }
//       else {
// 	win.document.getElementById("persona_button").setAttribute("image", "chrome://nettrust/skin/disconnect.png");
// 	win.disable_peer_buttons();
// 	win.update_gui_peers("0", "0");
//       }
//     }
//   }


}

function do_peer_ratings(url_val){
  var persona_id=document.getElementById("persona_menu").value;
  persona_id=persona_id.split(':').join("");
	//alert(""+persona_id+" "+url_val);
  //  if(persona_id.length > 0){
    //
    //alert("persona="+persona_id);
    //		var d = get_rating(url_val);
  var d = NTSharedState.SNDB.lookupAggRatingData(persona_id,url_val);
//var d = NTSharedState.SNDB("lookupAggRatingData",persona_id,url_val);
    //		alert("url "+url_val+" d.posCount " +d.posCount + " d.negCount" + d.negCount);
    update_gui_peers(Math.ceil(d.posAvg).toString(), Math.floor(d.negAvg).toString());
    //alert(d);
    //alert(Math.ceil(d.comCount).toString());
    //		update_gui_peers("2", "0");
    //		alert(get_full_rating(url_val));

    // Update Comment count label:
    var xComLabel = document.getElementById("comments");
    //xComLabel.value = "Comments: " + d.comCount;
    var value= "" + d.comCount;
    var value2 = d.posCount + d.negCount;
		
    xComLabel.setAttribute("label", "Comments: " + value + "/" + Math.ceil(value2).toString()  );
//   }
//   else{
//     //alert("no persona?");
//   }
}

function hide_broadcaster_ratings(){
  var broadcaster_list=document.getElementById("broadcast_list");
  if (null == broadcaster_list){
  	alert ("holy scubby doo, we could not find the broadcaster list");
  }
  var childNodes = broadcaster_list.childNodes;
  for (var i = 1; i < childNodes.length; i++) {
    var broadcaster = childNodes[i];
    // do something with child
    var bcast_chidren=broadcaster.childNodes;
    for (var j =0 ; j < bcast_chidren.length ;j++ ){
    	var bcast_field =bcast_chidren[j];
    	bcast_field.setAttribute("hidden","true");
    	if( j != 0){
    	  bcast_field.setAttribute("tooltiptext","?");
    	}
    }
       
  }  
}

function display_default_broadcaster_ratings(){
  var fileDS = rdfService.GetDataSource("chrome://nettrust/content/data/broadcaster_list.rdf");	
  var default_predicate=rdfService.GetResource("http://www.nettrust-site.net/rdf#default");
      
  var broadcaster_list=document.getElementById("broadcast_list");
  if (null == broadcaster_list){
  	alert ("holy scubby doo, we could not find the broadcaster list");
  }
  var childNodes = broadcaster_list.childNodes;
  for (var i = 1; i < childNodes.length; i++) {
    var broadcaster = childNodes[i];
    // do something with child
    var bcast_chidren=broadcaster.childNodes;
    //alert("id="+broadcaster.id);
    var bcast_subject=rdfService.GetResource(broadcaster.id);
    var bcast_default_rating = fileDS.GetTarget(bcast_subject, default_predicate, true);
    if(null == bcast_default_rating){
    	//alert("no default for: "+broadcaster.id);
    }
    else{
    	if (bcast_default_rating instanceof Components.interfaces.nsIRDFLiteral){
    	   if("negative" == bcast_default_rating.Value){
    		   //
    		   var bcast_field =bcast_chidren[0];
    		   bcast_field.setAttribute("hidden","false");
    		   bcast_field =bcast_chidren[1];
    		   //bcast_field.setAttribute("src","chrome://nettrust/skin/Pukey-Sm.png");
    		   bcast_field.setAttribute("src","chrome://nettrust/skin/smile_sad.png");
    		   bcast_field.setAttribute("hidden","false");
    	   }
    	   else{
     	       if("positive" == bcast_default_rating.Value){
    		      //
    		      var bcast_field =bcast_chidren[0];
    		      bcast_field.setAttribute("hidden","false");
    		      bcast_field =bcast_chidren[1];
    		      //bcast_field.setAttribute("src","chrome://nettrust/skin/Happy-Sm.png");
    		      bcast_field.setAttribute("src","chrome://nettrust/skin/smile.png");
    		      bcast_field.setAttribute("hidden","false");
    	       } 
    		   //alert("default rating is not negative! is is:"+ bcast_default_rating.Value);
    	   }
    	}
    }
       
  } 
  //now iterate over the RDF datasource and enable the appropiate
  //default 
}

//transform string into in memory data source
function parseRDFString(str, url)
{
  
  var memoryDS = Components.classes["@mozilla.org/rdf/datasource;1?name=in-memory-datasource"]
                   .createInstance(Components.interfaces.nsIRDFDataSource);

  var ios=Components.classes["@mozilla.org/network/io-service;1"]
                  .getService(Components.interfaces.nsIIOService);
  var baseUri=ios.newURI(url,null,null);

  var parser=Components.classes["@mozilla.org/rdf/xml-parser;1"]
                       .createInstance(Components.interfaces.nsIRDFXMLParser);
  parser.parseString(memoryDS,baseUri,str);

  return memoryDS;
}

function delayed_load_memory_DS(){
    var bdata=readExtFile("broadcaster_data.rdf");
    //alert("loading_ds?");
    broadcasterMemoryDS=parseRDFString(bdata, "chrome://nettrust/content/data/broadcaster_data.rdf");

    applyBroadcasterFilter(pending_url_val);
}


function applyBroadcasterFilter(url_val)
{
  
  var cond = document.getElementById("condition2");
  var triple = document.getElementById("doman_match_triple");
  var triple2 =document.getElementById("domain_match_triple2");

  //var url = document.getElementById("urlbar");	
  //var url_val = url.value
  //alert(url_val);
  var temp = new Array();
  temp = url_val.split('/'); //will give www.domain.com
  var domain =temp[2];
  //alert("domain='"+domain+"'");
  //new stuff
  hide_broadcaster_ratings();
  display_default_broadcaster_ratings();
    //get the extension's file directory, by using the extension id.
//    const id = "{65b3130e-8513-41b6-8ea8-43dbd9cc0bf5}";
		
    var ext = Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(id)
                    .getItemLocation(id);
    //generate the full path, doing replacements on special characters
    var full_filename='file:///'+
                      ext.path.replace(/\\/g, '\/').replace(/^\s*\/?/, '').replace(/\ /g, '%20')
                      +'/chrome/content/data/broadcaster_data.rdf';
	//var fileDS = rdfService.GetDataSourceBlocking("file://D:\\indiana\\nettrust\\svn\\nettrust\\trunk\\Toolbar\\chrome\\content\\broadcaster.rdf");
    //var fileDS = rdfService.GetDataSource("chrome://nettrust/content/data/broadcaster_data.rdf");
    
    if (null == broadcasterMemoryDS ){
    	pending_url_val=url_val;
    	window.setTimeout('delayed_load_memory_DS()',12);
    	return;
    	var bdata=readExtFile("broadcaster_data.rdf");
    	//alert("loading_ds?");
    	broadcasterMemoryDS=3;

    	broadcasterMemoryDS=parseRDFString(bdata, "chrome://nettrust/content/data/broadcaster_data.rdf");
        //alert("transformed_Ds?");
    }
    var fileDS=broadcasterMemoryDS;
    
    //var fileDS = rdfService.GetDataSourceBlocking(full_filename);
    //lets query the rdf, just to start .
	var camilo = rdfService.GetResource("http://www.nettrust-site.net/camilo");
	var domain_predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#domain");
    var rating_predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#rating");
    var name_predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#name");
    var default_predicate=rdfService.GetResource("http://www.nettrust-site.net/rdf#default");
    var enabled_resource=rdfService.GetResource("http://www.nettrust-site.net/rdf#enabled");
    var domain_target=rdfService.GetLiteral(""+domain);
    var true_literal=rdfService.GetLiteral("true");

    var subject;
    var list_container;
    var broadcaster_list;
    var broadcaster_res;
    var found_something="false";
    var happy_face;
    var sad_face;
    var bcast_label;
    var is_enabled;
    
    
    
    //Now we  iterate backwards from the url to the broadcaster
    var subject_list= fileDS.GetSources(domain_predicate, domain_target, true);
    
    //alert("got: "+subject.Value);
    //if (subject_list instanceof Components.interfaces.nsIRDFResource){
      //alert(subject.Value);
      while (subject_list.hasMoreElements()){
         found_something="true";
         subject = subject_list.getNext();
         if (subject instanceof Components.interfaces.nsIRDFResource){
           //alert("one? "+subject.Value);
           var contianer_predicates=fileDS.ArcLabelsIn(subject);
           if(null == contianer_predicates){
           	alert("wtg: no arcs in?");
           }
           while (contianer_predicates.hasMoreElements()){
              list_container=contianer_predicates.getNext();
           	  //alert("two:"+list_container.Value);
           	  if (list_container instanceof Components.interfaces.nsIRDFResource){
           	  	//alert("list container is an RDF resource value="+list_container.Value);
           	  	
           	  	broadcaster_list=fileDS.GetSources(list_container, subject, true);
           	    if(null == broadcaster_list){
           	  	  alert("no head subject");
           	    }
           	    while(broadcaster_list.hasMoreElements()){
           	      broadcaster_res=broadcaster_list.getNext();
           	      if (broadcaster_res instanceof Components.interfaces.nsIRDFResource){
           	      
           	        //alert("three pred="+broadcaster_res.Value+"Target="+subject.Value);
                    var broadcaster_hbox=document.getElementById(""+broadcaster_res.Value);
                    if (null==broadcaster_hbox){
    	              err_string="cannot get broadcaster hbox";
    	              //alert("error:"+err_string);
    	              //return ;
                    }
                    else{
                	  //check if positive
                      
                      //alert("got broadcaster hbox");
                	  bcast_label=broadcaster_hbox.firstChild;
                	  if(null == bcast_label ){
                	  	alert("label not found!");
                	  }
                	  var childNodes = broadcaster_hbox.childNodes;
                	                 	  
                	  var infile_url_rating = fileDS.GetTarget(subject, rating_predicate, true);
                      if (infile_url_rating instanceof Components.interfaces.nsIRDFLiteral){
                         //karensname = target.Value;
                      	 //alert("rating ="+infile_url_rating.Value );
                      	 if( "positive" == infile_url_rating.Value){
                      	 	childNodes[0].setAttribute("hidden","false");
                      	 	//childNodes[1].setAttribute("src","chrome://nettrust/skin/Happy-Sm.png");
                      	 	childNodes[1].setAttribute("src","chrome://nettrust/skin/smile.png");
                      	 	childNodes[1].setAttribute("hidden","false");
                      	 }
                      	 if( "negative" == infile_url_rating.Value){
                      	 	childNodes[0].setAttribute("hidden","false");
                      	 	//childNodes[2].setAttribute("hidden","false");
                      	 	//childNodes[1].setAttribute("src","chrome://nettrust/skin/Pukey-Sm.png");
                      	 	childNodes[1].setAttribute("src","chrome://nettrust/skin/smile_sad.png");
                      	 	childNodes[1].setAttribute("hidden","false");
                      	 }                	 
                      }
                      var infile_url_name = fileDS.GetTarget(subject, name_predicate, true);
                      if (infile_url_name instanceof Components.interfaces.nsIRDFLiteral){
                       	///
                      	var append_text=childNodes[1].getAttribute("tooltiptext");
                      	if (append_text.length < 2){
                      		append_text="";
                      	}
                      	childNodes[1].setAttribute("tooltiptext",
                      	                            append_text 
                      	                            + " " 
                      	                            + infile_url_name.Value +",");
                      	childNodes[2].setAttribute("tooltiptext",
                      	                      	    append_text 
                      	                            + " " 
                      	                            + infile_url_name.Value +",");                              
                      	 
                      }
                	  
                	  //childNodes[1].setAttribute("hidden","false");
                	  
                	  
                	  
                    }
                  }
                  else{
                  	alert("broadcaster_res is not an RDF resource");
                  }
           	    }
           	  	
           	  	
           	  	
           	  }
           	  else{
           	  	alert("list container is not an RDF resource");
           	  }
           	             	  

           	  
           	  
           }
           
           
           
           

           
           
           }
       }
    //}
    //else
    //{
    //	alert("unkown");
    //}
    if("false" == found_something){
    	//alert("nothing_found!");
    	//need to call something to clear out the doc..
    }
  return;
  // old stuff
  if (domain) {
    if (!triple) {
      triple = document.createElement("triple");
      triple.id = "doman_match_triple";
      triple.setAttribute("subject", "?photo");
      triple.setAttribute("predicate", "http://www.xulplanet.com/rdf/country");
    }
    triple.setAttribute("object", domain);
    triple2.setAttribute("object", domain);
    //cond.appendChild(triple);
    //alert("we ran:" + domain +"hello\n");
  }
  //alert("nothing here?");

  document.getElementById("broadcast_list").builder.rebuild();
  if(reload_broadcasters=="true"){
    //document.getElementById("broadcast_list").builder.refresh();
    reload_broadcasters="false";
    alert("reloading!");
    }
  else{
  	//alert("reload ="+reload_broadcasters);
  }
}

function test_broadcaster_refresh(){
	//document.getElementById("broadcaster_tree").builder.refresh();
	window.opener.document.getElementById("broadcast_list").builder.refresh();
    //document.getElementById("broadcaster_tree").builder.refresh();
    if(null==document.getElementById("broadcaster_tree").builder){
    	alert("broadcaster_tree not found!");
    }
    //alert("test_refresh_called");
}


function broadcaster_commit_changes(){
	do_broadcaster_changes();
	test_broadcaster_refresh();
	window.close();
}

//This function should only be called from the broadcaster edit
//window, it traverses the window and makes changes to the 
// broadcaster rdf...                   
function do_broadcaster_changes(){
	//init: open rdf and get element
	// oper: traverse dom and commit chages to rdf
	//fin: save the rdf datasource
	
	var err_string="";
    //get the extension's file directory, by using the extension id.
//    const id = "{65b3130e-8513-41b6-8ea8-43dbd9cc0bf5}";
		
    var ext = Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(id)
                    .getItemLocation(id);
    //generate the full path, doing replacements on special characters
    var full_filename='file:///'+
                      ext.path.replace(/\\/g, '\/').replace(/^\s*\/?/, '').replace(/\ /g, '%20')
                      +'/chrome/content/data/broadcaster_list.rdf';
	//var fileDS = rdfService.GetDataSourceBlocking("file://D:\\indiana\\nettrust\\svn\\nettrust\\trunk\\Toolbar\\chrome\\content\\broadcaster.rdf");

    var fileDS = rdfService.GetDataSource("rdf:composite-datasource");
    var fileDS1 = rdfService.GetDataSourceBlocking(full_filename);
    //var fileDS = rdfService.GetDataSource(full_filename);
    //lets query the rdf, just to start .

    var fileDS2=rdfService.GetDataSource("chrome://nettrust/content/data/broadcaster_data.rdf");

    fileDS.QueryInterface(Components.interfaces.nsIRDFCompositeDataSource);
    fileDS.AddDataSource(fileDS1);
    fileDS.AddDataSource(fileDS2);
    
    
    
    
	var camilo = rdfService.GetResource("http://www.nettrust-site.net/camilo");
	var name = rdfService.GetResource("http://www.nettrust-site.net/rdf#name");

	var camilosname;

    var target = fileDS.GetTarget(camilo, name, true);
    if (target instanceof Components.interfaces.nsIRDFLiteral){
       camilosname = target.Value;
    }
    // lest disable camilo and see what happens
    var subject = rdfService.GetResource("http://www.nettrust-site.net/camilo");
    var predicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#enabled");
    var oldValue = rdfService.GetLiteral("false");
    var newValue = rdfService.GetLiteral("true");

    //fileDS.Change(subject, predicate, oldValue, newValue);

    //what we need now is to actually do the iteration.
    // This iteration is kind of bad.. so beware
    var parser_start=document.getElementById("broadcast_tree_template");
    var tree_children=document.getElementById("broadcast_tree_template").nextSibling;
    if (null==tree_children){
    	 err_string="cannot get tree children dom!";
    	 return ;
    }
    var tree_item=tree_children.firstChild;
    if (null==tree_item){
    	 err_string=err_string+"cannot get tree row!";
    	 return ;
    }   
    var tree_row;
    var broad_enabled="";
    var tree_cell;
    while(null!=tree_item){
    	tree_row=tree_item.firstChild;
     	if(null==tree_row){
    		alert("did not got a  tree_row");
    	}   	
    	err_string=err_string+tree_item.id+" ";
    	tree_cell=tree_row.firstChild;
    	if(null==tree_cell){
    		alert("did not got a  tree_cell");
    	}
    	broad_enabled="";
    	while(null!=tree_cell){
    		//alert("got cell"+tree_cell.getAttribute("label"));
    		if (null!=tree_cell.getAttribute("value")){
    			//broad_enabled=tree_cell.getAttribute("value");
    			broad_enabled=broad_enabled+tree_cell.getAttribute("value");
    			err_string=err_string+tree_cell.getAttribute("value")+" ";
    			
    		}
    		tree_cell=tree_cell.nextSibling;
    	}
    	//query the rdf.. and if values differ, do change!!
    	subject = rdfService.GetResource(tree_item.id);
    	predicate =rdfService.GetResource("http://www.nettrust-site.net/rdf#enabled");
    	target = fileDS.GetTarget(subject, predicate, true);
    	if (target instanceof Components.interfaces.nsIRDFLiteral){
            oldValue = target.Value;
            oldValue = rdfService.GetLiteral(target.Value);
            newValue = rdfService.GetLiteral(broad_enabled);
            //if(target.Value!=broad_enabled){
            	//alert("changing "+tree_item.id+" oldValue:"+target.Value +"new:"+broad_enabled);
            //}
            fileDS.Change(subject, predicate, oldValue, newValue);
        }
    	
    	//prepare next iteration
    	tree_item=tree_item.nextSibling;
    }
    
    
    
    //to finalize, make the parent window reload the broadcaster data..
    fileDS1.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);
    fileDS1.Flush();
    //fileDS="0";
    //window.opener.document.getElementById("broadcast_list").builder.refresh();
    //document.getElementById("broadcaster_tree").builder.refresh();
	//alert("not implemented yet!" + camilosname +" "+err_string);	
	//window.opener.document.getElementById("broadcast_list").builder.refresh();
	//and close the window...
	//test_broadcaster_refresh();
	//window.close();
}



// Given a persona_id this function returns an array with the persona_id followed
// by the ids of all buddies.
function getFriendIDs (persona_id) {
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

  var persona_resource=rdfService.GetResource("http://www.nettrust-site.net/user/"+persona_id);
  var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
  var id_resource = 
    rdfService.GetResource("http://www.nettrust-site.net/rdf#id");
  var arr = new Array(); 
  arr[0] = persona_id.split(':').join("");
  var i=1;
  try{              
    container.Init(fileDS, persona_resource);
    var children = container.GetElements();
    while (children.hasMoreElements()){
      var child = children.getNext();
      if (child instanceof Components.interfaces.nsIRDFResource){
	var target = fileDS.GetTarget(child, id_resource, true);
	if (target instanceof Components.interfaces.nsIRDFLiteral){
	  arr[i]=target.Value.split(':').join("");
	  i=i+1;
	}
      }
    }   
  }
  catch (ex){
    // alert("Cannot initialize container: no friends?");
  }
  return arr;
}

function getPersonaIDs () {
//    const id = "{65b3130e-8513-41b6-8ea8-43dbd9cc0bf5}";
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
  var container = Components.classes["@mozilla.org/rdf/container;1"].
    createInstance(Components.interfaces.nsIRDFContainer);
  try {
    container.Init(fileDS, folderRes);
  }
  catch (ex){alert("problem here");}
  var i = 0;
  var pIDs = new Array();
  var children = container.GetElements();
  while (children.hasMoreElements()){
		  
    var child = children.getNext();
    if (child instanceof Components.interfaces.nsIRDFResource){
				 
      var target1= fileDS.GetTarget(child, netid, true);
      if (target1 instanceof Components.interfaces.nsIRDFLiteral){
	pIDs[i] = target1.Value;
	i++;
	//alert(net_id);
      }
    }
  }
  return pIDs;
}


// This reads the social_network.rdf file and returns an array of arrays
// that determine all personas with all friends. It is the input format for the
// MultiPersonaDB constructor.

function getSNIDs () {
  //  Make sure that the cached social_net.rdf datasource is fresh.
  var pIDs = getPersonaIDs();
  var i, SNIDs;

  for(i=0, SNIDs = []; i < pIDs.length; i++) 
    SNIDs.push(getFriendIDs(pIDs[i]));

  return SNIDs;
}

// alert("util.js loaded");
var saLastURL = "";
var color = "";
function siteAdvisorLookUp() {
  var saGreen = document.getElementById("saGreen");
  var saRed = document.getElementById("saRed");
  var saYellow = document.getElementById("saYellow");
  var siteAdvisorLabel = document.getElementById("siteAdvisor");
  var theFileDS = rdfService.GetDataSourceBlocking("chrome://nettrust/content/data/broadcaster_list.rdf");
  var theSubject = rdfService.GetResource("http://www.nettrust-site.net/siteadvisor");
  var thePredicate = rdfService.GetResource("http://www.nettrust-site.net/rdf#enabled");
  var x = theFileDS.GetTarget(theSubject, thePredicate, true);
	if (x instanceof Components.interfaces.nsIRDFLiteral) // if siteadvisor broadcaster isn't disabled...
	{
		if( x.Value == "true" )
		{
			try {
				var url = RateDB.trimURL( document.getElementById("urlbar").value );
				url = url.slice(0, url.indexOf("/"));
				if( saLastURL != url ) // let's not flood SA's servers
				{
					var xmlhttp=new XMLHttpRequest();
					xmlhttp.open("GET","http://dss2.siteadvisor.com/DSS/Query?Entitlement=FOO&Type=domain&version=2&name=" + url + "&client_ver=FF_26.5_6254&locale=en-US&aff_id=0",false);
					xmlhttp.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
					xmlhttp.send("");

					var doc=xmlhttp.responseXML;
					var classification = doc.getElementsByTagName("Classification");
					color = classification[0].getAttribute("color");
					var description = "SiteAdvisor says: " + doc.getElementsByTagName("description")[0].childNodes[0].nodeValue;
	//				dump( "\nsiteadvisor: " + color + "\n" );
					
					siteAdvisorLabel.hidden = false;
					saYellow.hidden = true;
					saGreen.hidden = true;
					saRed.hidden = true;
					
					if( description != null )
					{
						saGreen.tooltipText = description;
						saYellow.tooltipText = description;
						saRed.tooltipText = description;
					}
					else // if description is null, don't say "null"
					{
						saGreen.tooltipText = "";
						saYellow.tooltipText = "";
						saRed.tooltipText = "";
					}
					
					if( color == "green" )
						saGreen.hidden = false;
					else if( color == "red" )
						saRed.hidden = false;
					else if( color == "yellow" )
						saYellow.hidden = false;
					else
						siteAdvisorLabel.hidden = true;
						
					
					saLastURL = url;			
					return color;
				}
			} catch(ex) { dump( ex ); }
		}
		else 
		{ //if it's disabled
			siteAdvisorLabel.hidden = true;
			saYellow.hidden = true;
			saGreen.hidden = true;
			saRed.hidden = true;
		}
	}
	
}
