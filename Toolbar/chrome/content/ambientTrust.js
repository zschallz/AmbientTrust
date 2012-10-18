var win;
var transportService; // define atAttemptConnection's variables so they are public
var transport;
var outstream;
var stream;
var instream;
var pump;
atAttemptConnection(); // Attempt initial connection to Ambient Trust

function atAttemptConnection()
{
    var listener = {
      finished : function(data){
        dump(data);
      }
    }
    try {
        transportService =
          Components.classes["@mozilla.org/network/socket-transport-service;1"]
            .getService(Components.interfaces.nsISocketTransportService);
        transport = transportService.createTransport(null,0,"localhost",5331,null);

        outstream = transport.openOutputStream(0,0,0);

        stream = transport.openInputStream(0,0,0);
        dump( stream );
        instream = Components.classes["@mozilla.org/scriptableinputstream;1"]
          .createInstance(Components.interfaces.nsIScriptableInputStream);
        instream.init(stream);
        
        var dataListener = {
          data : "",
          onStartRequest: function(request, context){},
          onStopRequest: function(request, context, status){
            instream.close();
            outstream.close();
            listener.finished(this.data);
          },
          onDataAvailable: function(request, context, inputStream, offset, count){
    //        this.data += instream.read(count);
	        var theData = instream.read(count);
	        var theCount = count;
	        if( theData == 1 )
		        ambientTouchRate( 1 );
	        else if( theData == 0 )
		        ambientTouchRate( 0 );
	        else
	        {
		        dump( "data:" );
		        dump( theData );
	        }
    		
	        },
        };
        
        
        pump = Components.
          classes["@mozilla.org/network/input-stream-pump;1"].
            createInstance(Components.interfaces.nsIInputStreamPump);
        pump.init(stream, -1, -1, 0, 0, false);
        pump.asyncRead(dataListener,null);
    } catch (ex){
        alert(ex);
    }
}
function ambientTouchRate( direction ) {

	var persona_id=document.getElementById("persona_menu").value;
 	var url = document.getElementById("urlbar").value;
 	 // Confirm that the url is okay.
 	if (url.search(/^http:\/\//) >=0 || url.search(/^https:\/\//) >=0)
		res = NTSharedState.SNDB.lookupAggRatingData(persona_id, url);
//		dump( "asdf" );
  	else {
    	url = "<Unsupported-URI>";
   		res = null;
 	}
 	var myArray = NTSharedState.SNDB.lookupFullRatingData(persona_id, url);
 	var srcPID = myArray ? myArray[0][0] : pID;
	alert( myArray + "   " + srcPID );

	var theAvg = parseInt(myArray[0][2]);
	if( direction == 1 )
	{
		if( theAvg != 5 )
		{
			dump( theAvg );
			theAvg++;
			dump( theAvg );	
			NTSharedState.SNDB.updateWithXPRate( srcPID, url, theAvg );
			do_process( url );
		}
	}
	if( direction == 0 )
	{
		if( theAvg != -5 )
		{
			dump( theAvg );
			theAvg--;
			dump( theAvg );	
			NTSharedState.SNDB.updateWithXPRate( srcPID, url, theAvg );
			do_process( url );
		}
	}
	
}
function ambientUpdate(positive, negative) // TODO: rework ratings integers... they're confusing! -ZZ
{
	var rating;

	if( color == "red" ) //if siteadvisor() said this website is bad
	{
		rating = "0";
	}
	else // if siteadvisor() approved or had no opinion about the website...
	{
	
		if( negative < 0 )
		{
			dump( negative );
			switch( negative ) {
				case '-1':
					rating = "4";
				break;
				case '-2':
					rating = "3";
				break;
				case '-3':
					rating = "2";
				break;
				case '-4':
					rating = "1";
				break;
				case '-5':
					rating = "0";
				break;
			}
		}
		else if( positive > 0 )
		{
			dump( positive );
			switch( positive ) {
				case '1':
					rating = "6";
				break;
				case '2':
					rating = "7";
				break;
				case '3':
					rating = "8";
				break;
				case '4':
					rating = "8";
				break;
				case '5':
					rating = "9";
				break;
			}
		}
		else
			rating = "5"; // neutral
	}
    try {
	    outstream.write( rating, rating.length );
    } catch(ex) {
        atAttemptConnection(); // if we can't write to Ambient Trust, try and connect and rewrite.
        outstream.write( rating, rating.length );
    }
}