#!/bin/bash
##Script to generate the nettrust xpi installer
##
rm nettrust.xpi
rm /tmp/nettrust.zip
#zip -r /tmp/nettrust.zip *
zip -r  /tmp/nettrust.zip * -x *.svn*
mv /tmp/nettrust.zip nettrust.xpi
