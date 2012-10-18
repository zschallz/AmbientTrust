// Coded in Arduino C by Zachary Schall-Zimmerman (zschallz@indiana.edu)
// Acknowledgements: Richie Hazlewood, L Jean Camp, E.T.H.O.S. Project (http://ethos.indiana.edu/)

// Define LED Pins
int redPin     = 11;
int greenPin   = 10;
int animation = 0; // refers to speed of animation. 0 means no animation. Integer between 0-5.


// Define Global Variables
int rating     = 0;
int red    = 0;
int green  = 0;
byte val = 255;
byte posVal = 255;
byte lastVal = 255;
byte lastPosVal = 255;
int threshold = 100;
int threshold2 = 100;
int ratingInCaseOfPing = 0;


void setup() {
	pinMode( redPin, OUTPUT );
	pinMode( greenPin, OUTPUT );
	Serial.begin( 9600 );        // connect to the serial port
}

void loop () {
	if( Serial.available() > 0 )
		rating = Serial.read();      // read the serial port
	// if the stored value is a single-digit number, blink the LED that number
	if (rating >= '0' && rating <= '9' ) {
		rating = rating - '0';          // convert from character to number
		if( updateDisplay( rating ) < 0 )
			Serial.println( "401" );
                        ratingInCaseOfPing = rating;
	}
        else if (rating == 'p')
        {
          Serial.println( "o" );
          rating = ratingInCaseOfPing;
        }
	if( checkNegSensor() < 0 )
		Serial.print( "T0X\n" );
	if( checkPosSensor() < 0 )
		Serial.print( "T1X\n" );
	if( animation > 0 )
		animateRating( red, green, animation );
    delay( 10 );
}

int fadeToNewColor( int newRed, int newGreen )
{
    do
    {
		if( red < newRed )
			red+=5;
		else if( red > newRed )
			red-=5;
		if( green < newGreen )
			green+=5;
		else if( green > newGreen )
			green-=5;
		
		analogWrite( redPin, red );
		analogWrite( greenPin, green );
		delay( 20 );
	}
	while( red != newRed || green != newGreen );
/*	Serial.print( "R" );
	Serial.print( red, DEC );
	Serial.print( "G" );
	Serial.print( green, DEC );
	Serial.print( "\n" );
	return( 0 );*/
}
int checkNegSensor()
{
	int negTouchSensor = 3;
	val = analogRead(negTouchSensor);
	if (val < threshold && lastVal > threshold)
	{
//		Serial.println("T0D");
	}
	if (lastVal < threshold && val > threshold)
	{
		Serial.println("0"); // 4 chars
	}
	lastVal = val;
	return 0;
}
int checkPosSensor()
{
	int posTouchSensor = 1;
	posVal = analogRead(posTouchSensor);
	if (posVal < threshold2 && lastPosVal > threshold2) 
	{
//		Serial.println("T1D");
	}
	if (lastPosVal < threshold2 && posVal > threshold2)
	{
		Serial.println("1"); // 3 chars
	}
	lastPosVal = posVal;
	return 0;
}

int animateRating( int red, int green, int animation )
{
	int newRed = red;
	int newGreen = green;
	int animateRed,animateGreen = 0;
	int numSteps = 50;
	float redPerStep  = red / numSteps;
	float greenPerStep = green / numSteps;
	
	for( int i=0; i<numSteps; i++ )
	{
		if( newRed < animateRed )
			newRed=animateRed;
		else
			newRed-=redPerStep;
		if( newGreen < animateGreen )
			newGreen=animateRed;
		else
			newGreen-=greenPerStep;
		/*     Serial.print( "R" );
		 Serial.print( newRed, DEC );
		 Serial.print( "-" );
		 Serial.print( redPerStep, DEC );
		 Serial.print( "G" );
		 Serial.print( newGreen, DEC );
		 Serial.print( "-" );
		 Serial.print( greenPerStep, DEC );
		 Serial.print( "\n" );*/
		
		analogWrite( redPin, newRed );
		analogWrite( greenPin, newGreen );
		if( Serial.available() > 0 )
			rating = Serial.read();      // read the serial port
		// if the stored value is a single-digit number, blink the LED that number
		if (rating >= '0' && rating <= '9' ) {
			break;
			rating = rating - '0';          // convert from character to number
			if( updateDisplay( rating ) < 0 )
				Serial.println( "401" );
		}  
		if( checkNegSensor() < 0 )
			Serial.println( "T0X" );
		delay( 20 );
	}
	if( checkPosSensor() < 0 )
		Serial.println( "T1X" );
	for( int i=0; i<numSteps; i++ )
	{
		animateRed = red;
		animateGreen = green;
		
		if( newRed > animateRed )
			newRed=animateRed;
		else
			newRed+=redPerStep;
		if( newGreen > animateGreen )
			newGreen=animateRed;
		else
			newGreen+=greenPerStep;
		analogWrite( redPin, newRed );
		analogWrite( greenPin, newGreen );
		if( Serial.available() > 0 )
			rating = Serial.read();      // read the serial port
		// if the stored value is a single-digit number, blink the LED that number
		if (rating >= '0' && rating <= '9' ) {
			break;
			rating = rating - '0';          // convert from character to number
			if( updateDisplay( rating ) < 0 )
				Serial.println( "401" );
		}  
		if( checkNegSensor() < 0 )
			Serial.println( "0 X" );
		delay( 20 );
	}
}

int updateDisplay( int rating )
{
	switch( rating )
	{
		case 0:
			fadeToNewColor( 255, 0 );
			animation = 1;
			break;
		case 1:
			fadeToNewColor( 255, 55 );
			animation = 2;
			break;
		case 2:
			fadeToNewColor( 255, 105 );
			animation = 3;
			break;     
		case 3:
			fadeToNewColor( 255, 155 );
			animation = 4;
			break; 
		case 4:
			fadeToNewColor( 255, 205 );
			animation = 5;
			break;
		case 5:
			fadeToNewColor( 255, 255 );
			animation = 0;
			break;
		case 6:
			fadeToNewColor( 205, 255 );
			animation = 0;
			break;
		case 7:
			fadeToNewColor( 155, 255 );
			animation = 0;
			break;
		case 8:
			fadeToNewColor( 105, 255 );
			animation = 0;
			break;     
		case 9:
			fadeToNewColor( 0, 255 );
			animation = 0;
			break; 
	}
}
